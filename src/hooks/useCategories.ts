"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryData, Subcategory } from "@/types/expense";
import { DEFAULT_CATEGORIES, getNextColor, suggestIconForCategory } from "@/utils/categories";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useDataRefresh } from "@/contexts/DataRefreshContext";
import { isNetworkError, commitWrite, OFFLINE_WRITE_MESSAGE } from "@/utils/offlineQueue";
import { markOffline, markOnline } from "@/utils/connectivity";

// Shared across all hook instances in the same browser session.
// Ensures only one INSERT fires even if auth re-emits and the effect re-runs
// while a seed is still in flight.
const activeSeedByUser = new Map<string, Promise<CategoryData[]>>();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type DbRow = {
  id: string;
  user_id: string;
  name: string;
  color: string;
  bg_color: string;
  text_color: string;
  icon: string;
  subcategories: Subcategory[];
  created_at: string;
};

function rowToCategory(row: DbRow): CategoryData {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    bgColor: row.bg_color,
    textColor: row.text_color,
    icon: row.icon,
    subcategories: row.subcategories ?? [],
  };
}

function categoryToRow(cat: CategoryData, userId: string) {
  return {
    id: cat.id,
    user_id: userId,
    name: cat.name,
    color: cat.color,
    bg_color: cat.bgColor,
    text_color: cat.textColor,
    icon: cat.icon,
    subcategories: cat.subcategories,
  };
}

export function useCategories() {
  const { user } = useAuth();
  const { refetchKey } = useDataRefresh();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedForUser = useRef<string | null>(null);
  const loadedForRefetchKey = useRef<number>(-1);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setCategories([]);
        setIsLoaded(false);
        loadedForUser.current = null;
        loadedForRefetchKey.current = -1;
        return;
      }

      if (loadedForUser.current === user.id && loadedForRefetchKey.current === refetchKey) return;
      loadedForUser.current = user.id;
      loadedForRefetchKey.current = refetchKey;

      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at");

      if (cancelled) return;

      if (fetchError) {
        if (isNetworkError(fetchError)) markOffline();
        setError(fetchError.message);
        setIsLoaded(true);
        return;
      }

      markOnline();
      setError(null);
      const existing = (data as DbRow[]).map(rowToCategory);

      // Seed the six built-in defaults ONLY for a brand-new user whose category
      // table is empty. We must NOT re-seed individual defaults that an existing
      // user has intentionally deleted — otherwise deleting e.g. "Shopping" would
      // silently resurrect it (as a fresh default, sans expenses) on the next fetch.
      if (existing.length === 0) {
        // Reuse an in-flight seed promise if one already exists for this user.
        // This prevents duplicate INSERTs when auth re-emits and the effect
        // re-runs while a seed is still in progress.
        const existingSeed = activeSeedByUser.get(user.id);
        let seedPromise: Promise<CategoryData[]>;

        if (existingSeed) {
          seedPromise = existingSeed;
        } else {
          const capturedUserId = user.id;
          const rows = DEFAULT_CATEGORIES.map((cat) =>
            categoryToRow(
              {
                ...cat,
                id: generateId(),
                subcategories: cat.subcategories.map((s) => ({ ...s, id: generateId() })),
              },
              capturedUserId
            )
          );
          seedPromise = (async (): Promise<CategoryData[]> => {
            const { data: inserted, error: insertError } = await supabase
              .from("categories")
              .upsert(rows, { onConflict: "user_id,name", ignoreDuplicates: true })
              .select();
            if (insertError) {
              // Remove on error so the next run can retry
              activeSeedByUser.delete(capturedUserId);
              throw new Error(insertError.message);
            }
            // Deduplication is only needed during the in-flight window; the seed
            // never runs again once the table is non-empty, so drop the promise.
            activeSeedByUser.delete(capturedUserId);
            return (inserted as DbRow[]).map(rowToCategory);
          })();
          activeSeedByUser.set(user.id, seedPromise);
        }

        let seededCats: CategoryData[];
        try {
          seededCats = await seedPromise;
        } catch (e: unknown) {
          if (cancelled) return;
          setError(e instanceof Error ? e.message : "Failed to seed categories");
          setCategories([]);
          setIsLoaded(true);
          return;
        }

        if (cancelled) return;
        setCategories(seededCats);
      } else {
        setCategories(existing);
      }
      setIsLoaded(true);
    }

    run();

    return () => {
      cancelled = true;
      loadedForUser.current = null;
      loadedForRefetchKey.current = -1;
    };
  }, [user, refetchKey]);

  const addCategory = useCallback(
    async (name: string, icon?: string): Promise<CategoryData> => {
      if (!user) throw new Error("Not authenticated");
      const palette = getNextColor(categories.length);
      const newCat: CategoryData = {
        id: generateId(),
        name: name.trim(),
        ...palette,
        icon: icon ?? suggestIconForCategory(name),
        subcategories: [{ id: generateId(), name: "General" }],
      };
      const { error: e } = await supabase
        .from("categories")
        .insert(categoryToRow(newCat, user.id));
      if (e) throw new Error(e.message);
      setCategories((prev) => [...prev, newCat]);
      return newCat;
    },
    [categories.length, user]
  );

  const updateCategory = useCallback(
    async (id: string, name: string, icon?: string): Promise<void> => {
      if (!user) throw new Error("Not authenticated");
      const patch: Record<string, string> = { name: name.trim() };
      if (icon !== undefined) patch.icon = icon;
      const { error: e } = await supabase
        .from("categories")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user.id);
      if (e) throw new Error(e.message);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, name: name.trim(), ...(icon !== undefined ? { icon } : {}) }
            : c
        )
      );
    },
    [user]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error("Not authenticated");
      const { error: e } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (e) throw new Error(e.message);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    [user]
  );

  // Removes a category from local state only — no DB write. Used after the
  // `delete_category_cascade` RPC (in useExpenses.deleteCategoryWithExpenses) has
  // already deleted the row server-side, so issuing a second delete here would be a
  // redundant round-trip that could spuriously fail after the real delete succeeded.
  const removeCategoryFromState = useCallback((id: string): void => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addSubcategory = useCallback(
    async (categoryId: string, name: string): Promise<Subcategory> => {
      if (!user) throw new Error("Not authenticated");
      const sub: Subcategory = { id: generateId(), name: name.trim() };
      const cat = categories.find((c) => c.id === categoryId);
      const updatedSubs = cat ? [...cat.subcategories, sub] : [sub];
      const { error: e } = await supabase
        .from("categories")
        .update({ subcategories: updatedSubs })
        .eq("id", categoryId)
        .eq("user_id", user.id);
      if (e) throw new Error(e.message);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, subcategories: updatedSubs } : c
        )
      );
      return sub;
    },
    [categories, user]
  );

  const updateSubcategory = useCallback(
    async (categoryId: string, subcategoryId: string, name: string): Promise<void> => {
      const cat = categories.find((c) => c.id === categoryId);
      const sub = cat?.subcategories.find((s) => s.id === subcategoryId);
      // Guard: never rename the "General" subcategory — it is a protected default
      // that other features (subcategory deletion, expense fallback) rely on.
      if (sub?.name === "General") return;
      if (!user) throw new Error("Not authenticated");
      const updatedSubs = cat
        ? cat.subcategories.map((s) =>
            s.id === subcategoryId ? { ...s, name: name.trim() } : s
          )
        : [];
      const { error: e } = await supabase
        .from("categories")
        .update({ subcategories: updatedSubs })
        .eq("id", categoryId)
        .eq("user_id", user.id);
      if (e) throw new Error(e.message);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, subcategories: updatedSubs } : c
        )
      );
    },
    [categories, user]
  );

  const deleteSubcategory = useCallback(
    async (categoryId: string, subcategoryId: string): Promise<void> => {
      const cat = categories.find((c) => c.id === categoryId);
      const sub = cat?.subcategories.find((s) => s.id === subcategoryId);
      if (sub?.name === "General") return;
      if (!user) throw new Error("Not authenticated");
      const updatedSubs = cat
        ? cat.subcategories.filter((s) => s.id !== subcategoryId)
        : [];
      const { error: e } = await supabase
        .from("categories")
        .update({ subcategories: updatedSubs })
        .eq("id", categoryId)
        .eq("user_id", user.id);
      if (e) throw new Error(e.message);
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, subcategories: updatedSubs } : c
        )
      );
    },
    [categories, user]
  );

  const getSubcategories = useCallback(
    (categoryName: string): Subcategory[] => {
      const cat = categories.find((c) => c.name === categoryName);
      return cat?.subcategories ?? [];
    },
    [categories]
  );

  const importCategories = useCallback(
    (categoryNames: string[]): void => {
      const existingNames = new Set(categories.map((c) => c.name));
      const newCats: CategoryData[] = categoryNames
        .filter((name) => !existingNames.has(name))
        .map((name, i) => ({
          id: generateId(),
          name,
          ...getNextColor(categories.length + i),
          icon: suggestIconForCategory(name),
          subcategories: [{ id: generateId(), name: "General" }],
        }));
      if (newCats.length === 0) return;
      setCategories((prev) => [...prev, ...newCats]);
      const rows = newCats.map((cat) => categoryToRow(cat, user!.id));
      const addedIds = new Set(newCats.map((c) => c.id));
      const rollback = () =>
        setCategories((prev) => prev.filter((c) => !addedIds.has(c.id)));
      // There is no offline queue for categories, so a failed import — network or
      // server — rolls back the optimistic rows and surfaces the error rather than
      // leaving local state diverged from the database.
      commitWrite(() => supabase.from("categories").insert(rows), {
        onNetworkError: () => { markOffline(); rollback(); setError(OFFLINE_WRITE_MESSAGE); },
        onServerError: (msg) => { rollback(); setError(msg); },
      });
    },
    [categories, user]
  );

  return {
    categories,
    isLoaded,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    removeCategoryFromState,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getSubcategories,
    importCategories,
  };
}

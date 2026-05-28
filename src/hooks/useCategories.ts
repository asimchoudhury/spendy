"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryData, Subcategory } from "@/types/expense";
import { DEFAULT_CATEGORIES, getNextColor, suggestIconForCategory } from "@/utils/categories";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useDataRefresh } from "@/contexts/DataRefreshContext";

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
        setError(fetchError.message);
        setIsLoaded(true);
        return;
      }

      const existing = (data as DbRow[]).map(rowToCategory);
      const existingNames = new Set(existing.map((c) => c.name));
      const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name));

      if (missing.length > 0) {
        const seeded = missing.map((cat) => ({
          ...cat,
          id: generateId(),
          subcategories: cat.subcategories.map((s) => ({ ...s, id: generateId() })),
        }));
        const rows = seeded.map((cat) => categoryToRow(cat, user.id));
        const { data: inserted, error: insertError } = await supabase
          .from("categories")
          .insert(rows)
          .select();

        if (cancelled) return;

        if (insertError) {
          setError(insertError.message);
          setCategories(existing);
        } else {
          setCategories([...existing, ...(inserted as DbRow[]).map(rowToCategory)]);
        }
      } else {
        setCategories(existing);
      }
      setIsLoaded(true);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [user, refetchKey]);

  const addCategory = useCallback(
    (name: string, icon?: string): CategoryData => {
      const palette = getNextColor(categories.length);
      const newCat: CategoryData = {
        id: generateId(),
        name: name.trim(),
        ...palette,
        icon: icon ?? suggestIconForCategory(name),
        subcategories: [{ id: generateId(), name: "General" }],
      };
      setCategories((prev) => [...prev, newCat]);
      supabase
        .from("categories")
        .insert(categoryToRow(newCat, user!.id))
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
      return newCat;
    },
    [categories.length, user]
  );

  const updateCategory = useCallback(
    (id: string, name: string, icon?: string): void => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, name: name.trim(), ...(icon !== undefined ? { icon } : {}) }
            : c
        )
      );
      const patch: Record<string, string> = { name: name.trim() };
      if (icon !== undefined) patch.icon = icon;
      supabase
        .from("categories")
        .update(patch)
        .eq("id", id)
        .eq("user_id", user!.id)
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
    },
    [user]
  );

  const deleteCategory = useCallback(
    (id: string): void => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id)
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
    },
    [user]
  );

  const addSubcategory = useCallback(
    (categoryId: string, name: string): Subcategory => {
      const sub: Subcategory = { id: generateId(), name: name.trim() };
      const cat = categories.find((c) => c.id === categoryId);
      const updatedSubs = cat ? [...cat.subcategories, sub] : [sub];
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, subcategories: updatedSubs } : c
        )
      );
      supabase
        .from("categories")
        .update({ subcategories: updatedSubs })
        .eq("id", categoryId)
        .eq("user_id", user!.id)
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
      return sub;
    },
    [categories, user]
  );

  const updateSubcategory = useCallback(
    (categoryId: string, subcategoryId: string, name: string): void => {
      const cat = categories.find((c) => c.id === categoryId);
      const updatedSubs = cat
        ? cat.subcategories.map((s) =>
            s.id === subcategoryId ? { ...s, name: name.trim() } : s
          )
        : [];
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, subcategories: updatedSubs } : c
        )
      );
      supabase
        .from("categories")
        .update({ subcategories: updatedSubs })
        .eq("id", categoryId)
        .eq("user_id", user!.id)
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
    },
    [categories, user]
  );

  const deleteSubcategory = useCallback(
    (categoryId: string, subcategoryId: string): void => {
      const cat = categories.find((c) => c.id === categoryId);
      const updatedSubs = cat
        ? cat.subcategories.filter((s) => s.id !== subcategoryId)
        : [];
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId ? { ...c, subcategories: updatedSubs } : c
        )
      );
      supabase
        .from("categories")
        .update({ subcategories: updatedSubs })
        .eq("id", categoryId)
        .eq("user_id", user!.id)
        .then(({ error: e }) => {
          if (e) setError(e.message);
        });
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
      supabase
        .from("categories")
        .insert(rows)
        .then(({ error: e }) => {
          if (e) setError(e.message);
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
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getSubcategories,
    importCategories,
  };
}

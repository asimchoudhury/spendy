"use client";

import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { Expense, BackupExpense, ExpenseFilters, ExpenseFormData } from "@/types/expense";
import { useLocalStorage } from "./useLocalStorage";
import { generateSampleExpenses } from "@/utils/csv";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useDataRefresh } from "@/contexts/DataRefreshContext";
import {
  DbExpenseRow,
  rowToExpense,
  expenseToRow,
} from "@/utils/expenseMapping";
import { enqueue, isNetworkError, commitWrite, OFFLINE_WRITE_MESSAGE } from "@/utils/offlineQueue";
import { markOffline, markOnline } from "@/utils/connectivity";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  dateFrom: "",
  dateTo: "",
};

export function useExpenses() {
  const { user } = useAuth();
  const { refetchKey } = useDataRefresh();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedForUser = useRef<string | null>(null);
  const loadedForRefetchKey = useRef<number>(-1);

  // filters stay in localStorage — ephemeral UI state
  const [filters, setFilters] = useLocalStorage<ExpenseFilters>(
    "expense-filters",
    DEFAULT_FILTERS
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setExpenses([]);
        setIsLoaded(false);
        loadedForUser.current = null;
        loadedForRefetchKey.current = -1;
        return;
      }

      if (loadedForUser.current === user.id && loadedForRefetchKey.current === refetchKey) return;
      loadedForUser.current = user.id;
      loadedForRefetchKey.current = refetchKey;

      const { data, error: fetchError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        if (isNetworkError(fetchError)) markOffline();
        setError(fetchError.message);
        setIsLoaded(true);
        return;
      }

      markOnline();
      setError(null);
      setExpenses((data as DbExpenseRow[]).map(rowToExpense));
      setIsLoaded(true);
    }

    run();

    return () => {
      cancelled = true;
      loadedForUser.current = null;
      loadedForRefetchKey.current = -1;
    };
  }, [user, refetchKey]);

  const seedSampleData = useCallback(() => {
    const samples = generateSampleExpenses();
    const now = new Date().toISOString();
    const seeded: Expense[] = samples.map((s) => ({
      ...s,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    setExpenses(seeded);
    supabase
      .from("expenses")
      .delete()
      .eq("user_id", user!.id)
      .then(({ error: delErr }) => {
        if (delErr) { setError(delErr.message); return; }
        const rows = seeded.map((e) => expenseToRow(e, user!.id));
        supabase
          .from("expenses")
          .insert(rows)
          .then(({ error: insErr }) => { if (insErr) setError(insErr.message); });
      });
  }, [user]);

  const addExpense = useCallback(
    (data: ExpenseFormData): Expense | null => {
      const amount = parseFloat(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Invalid amount — expense was not saved.");
        return null;
      }
      const now = new Date().toISOString();
      const expense: Expense = {
        id: generateId(),
        date: data.date,
        amount,
        category: data.category,
        subcategory: data.subcategory || "General",
        description: data.description.trim(),
        createdAt: now,
        updatedAt: now,
      };
      setExpenses((prev) => [expense, ...prev]);
      const row = expenseToRow(expense, user!.id);
      // Offline: persist the mutation so it survives a tab close and replays on
      // reconnect. A real server error surfaces AND rolls back the optimistic row
      // so local state can't diverge from the database.
      commitWrite(() => supabase.from("expenses").insert(row), {
        onNetworkError: () => { markOffline(); enqueue({ type: "add", row }); },
        onServerError: (msg) => {
          setError(msg);
          setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
        },
      });
      return expense;
    },
    [user]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseFormData): void => {
      const amount = parseFloat(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Invalid amount — changes were not saved.");
        return;
      }
      const updatedAt = new Date().toISOString();
      let prevExpense: Expense | undefined;
      setExpenses((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          prevExpense = e;
          return {
            ...e,
            date: data.date,
            amount,
            category: data.category,
            subcategory: data.subcategory || "General",
            description: data.description.trim(),
            updatedAt,
          };
        })
      );
      const fields = {
        date: data.date,
        amount,
        category: data.category,
        subcategory: data.subcategory || "General",
        description: data.description.trim(),
        updated_at: updatedAt,
      };
      commitWrite(
        () => supabase.from("expenses").update(fields).eq("id", id).eq("user_id", user!.id),
        {
          onNetworkError: () => {
            markOffline();
            enqueue({ type: "update", expenseId: id, userId: user!.id, fields });
          },
          onServerError: (msg) => {
            setError(msg);
            if (prevExpense) {
              setExpenses((prev) => prev.map((e) => (e.id === id ? prevExpense! : e)));
            }
          },
        }
      );
    },
    [user]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      let removed: Expense | undefined;
      setExpenses((prev) => {
        removed = prev.find((e) => e.id === id);
        return prev.filter((e) => e.id !== id);
      });
      commitWrite(
        () => supabase.from("expenses").delete().eq("id", id).eq("user_id", user!.id),
        {
          onNetworkError: () => {
            markOffline();
            enqueue({ type: "delete", expenseId: id, userId: user!.id });
          },
          onServerError: (msg) => {
            setError(msg);
            // Restore the row only if it isn't already back (e.g. via refetch).
            if (removed) {
              setExpenses((prev) => (prev.some((e) => e.id === id) ? prev : [removed!, ...prev]));
            }
          },
        }
      );
    },
    [user]
  );

  const smartImportExpenses = useCallback(
    (backupExpenses: BackupExpense[]): { added: number; skipped: number } => {
      const existingIds = new Set(expenses.map((e) => e.id));
      const now = new Date().toISOString();
      const toAdd: Expense[] = backupExpenses
        .filter((e) => !e.id || !existingIds.has(e.id))
        .map((e) => ({
          id: e.id || generateId(),
          date: e.date,
          amount: e.amount,
          category: e.category,
          subcategory: e.subcategory || "General",
          description: e.description,
          createdAt: e.createdAt || now,
          updatedAt: e.updatedAt || now,
        }));
      if (toAdd.length > 0) {
        setExpenses((prev) => [...prev, ...toAdd]);
        const rows = toAdd.map((e) => expenseToRow(e, user!.id));
        const addedIds = new Set(toAdd.map((e) => e.id));
        const rollback = () =>
          setExpenses((prev) => prev.filter((e) => !addedIds.has(e.id)));
        // Import requires a live connection (gated by the page) and there is no
        // offline queue for bulk imports, so any failure — network or server —
        // rolls back the optimistic rows and surfaces the error rather than
        // leaving local state diverged from the database.
        commitWrite(() => supabase.from("expenses").insert(rows), {
          onNetworkError: () => { markOffline(); rollback(); setError(OFFLINE_WRITE_MESSAGE); },
          onServerError: (msg) => { rollback(); setError(msg); },
        });
      }
      return { added: toAdd.length, skipped: backupExpenses.length - toAdd.length };
    },
    [expenses, user]
  );

  const replaceAllExpenses = useCallback(
    (backupExpenses: BackupExpense[]): void => {
      const now = new Date().toISOString();
      const normalized: Expense[] = backupExpenses.map((e) => ({
        id: e.id || generateId(),
        date: e.date,
        amount: e.amount,
        category: e.category,
        subcategory: e.subcategory || "General",
        description: e.description,
        createdAt: e.createdAt || now,
        updatedAt: e.updatedAt || now,
      }));
      setExpenses(normalized);
      supabase
        .from("expenses")
        .delete()
        .eq("user_id", user!.id)
        .then(({ error: delErr }) => {
          if (delErr) { setError(delErr.message); return; }
          if (normalized.length === 0) return;
          const rows = normalized.map((e) => expenseToRow(e, user!.id));
          supabase
            .from("expenses")
            .insert(rows)
            .then(({ error: insErr }) => { if (insErr) setError(insErr.message); });
        });
    },
    [user]
  );

  const bulkMigrateCategory = useCallback(
    async (fromCategory: string, toCategory: string, toSubcategory: string): Promise<void> => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      const { error: e } = await supabase
        .from("expenses")
        .update({ category: toCategory, subcategory: toSubcategory, updated_at: now })
        .eq("user_id", user.id)
        .eq("category", fromCategory);
      if (e) throw new Error(e.message);
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.category === fromCategory
            ? { ...exp, category: toCategory, subcategory: toSubcategory, updatedAt: now }
            : exp
        )
      );
    },
    [user]
  );

  const bulkMigrateSubcategory = useCallback(
    async (category: string, fromSubcategory: string, toSubcategory: string): Promise<void> => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      const { error: e } = await supabase
        .from("expenses")
        .update({ subcategory: toSubcategory, updated_at: now })
        .eq("user_id", user.id)
        .eq("category", category)
        .eq("subcategory", fromSubcategory);
      if (e) throw new Error(e.message);
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.category === category && exp.subcategory === fromSubcategory
            ? { ...exp, subcategory: toSubcategory, updatedAt: now }
            : exp
        )
      );
    },
    [user]
  );

  const bulkRenameCategory = useCallback(
    async (oldName: string, newName: string): Promise<void> => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      const { error: e } = await supabase
        .from("expenses")
        .update({ category: newName, updated_at: now })
        .eq("user_id", user.id)
        .eq("category", oldName);
      if (e) throw new Error(e.message);
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.category === oldName
            ? { ...exp, category: newName, updatedAt: now }
            : exp
        )
      );
    },
    [user]
  );

  // Atomically deletes the category row AND all of its expenses in a single
  // transaction via the `delete_category_cascade` Postgres function (see
  // supabase/migrations/0001_delete_category_cascade.sql). Because both tables are
  // deleted server-side in one transaction, there is no partial-failure window.
  // On success we update both local states: expenses here, the category row via
  // useCategories.removeCategoryFromState (called by the page).
  const deleteCategoryWithExpenses = useCallback(
    async (categoryName: string): Promise<void> => {
      if (!user) throw new Error("Not authenticated");
      const { error: e } = await supabase.rpc("delete_category_cascade", {
        cat_name: categoryName,
      });
      if (e) throw new Error(e.message);
      setExpenses((prev) => prev.filter((exp) => exp.category !== categoryName));
    },
    [user]
  );

  const bulkRenameSubcategory = useCallback(
    async (category: string, oldName: string, newName: string): Promise<void> => {
      if (!user) throw new Error("Not authenticated");
      const now = new Date().toISOString();
      const { error: e } = await supabase
        .from("expenses")
        .update({ subcategory: newName, updated_at: now })
        .eq("user_id", user.id)
        .eq("category", category)
        .eq("subcategory", oldName);
      if (e) throw new Error(e.message);
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.category === category && exp.subcategory === oldName
            ? { ...exp, subcategory: newName, updatedAt: now }
            : exp
        )
      );
    },
    [user]
  );

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (
            !e.description.toLowerCase().includes(q) &&
            !e.category.toLowerCase().includes(q) &&
            !e.subcategory.toLowerCase().includes(q)
          )
            return false;
        }
        if (filters.category !== "All" && e.category !== filters.category)
          return false;
        if (filters.dateFrom && e.date < filters.dateFrom) return false;
        if (filters.dateTo && e.date > filters.dateTo) return false;
        return true;
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
  }, [expenses, filters]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonth = (() => {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const monthly = expenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((s, e) => s + e.amount, 0);
    const lastMonthTotal = expenses
      .filter((e) => e.date.startsWith(lastMonth))
      .reduce((s, e) => s + e.amount, 0);

    const byCategory = expenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const topCategory = Object.entries(byCategory).sort(
      ([, a], [, b]) => b - a
    )[0];

    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      total,
      monthly,
      lastMonthTotal,
      byCategory,
      topCategory: topCategory ? topCategory[0] : null,
      topCategoryAmount: topCategory ? topCategory[1] : 0,
      count: expenses.length,
      monthlyCount: expenses.filter((e) => e.date.startsWith(currentMonth)).length,
      categoryData,
    };
  }, [expenses]);

  return {
    expenses,
    filteredExpenses,
    filters,
    setFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    smartImportExpenses,
    replaceAllExpenses,
    bulkMigrateCategory,
    bulkMigrateSubcategory,
    bulkRenameCategory,
    bulkRenameSubcategory,
    deleteCategoryWithExpenses,
    seedSampleData,
    isLoaded,
    error,
    stats,
  };
}

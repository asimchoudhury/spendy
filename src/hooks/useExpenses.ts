"use client";

import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { Expense, BackupExpense, ExpenseFilters, ExpenseFormData } from "@/types/expense";
import { useLocalStorage } from "./useLocalStorage";
import { generateSampleExpenses } from "@/utils/csv";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_FILTERS: ExpenseFilters = {
  search: "",
  category: "All",
  dateFrom: "",
  dateTo: "",
};

type DbExpenseRow = {
  id: string;
  user_id: string;
  amount: string | number;
  category: string;
  subcategory: string | null;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};

function rowToExpense(row: DbExpenseRow): Expense {
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount),
    category: row.category,
    subcategory: row.subcategory ?? "General",
    description: row.description ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function expenseToRow(expense: Expense, userId: string) {
  return {
    id: expense.id,
    user_id: userId,
    amount: expense.amount,
    category: expense.category,
    subcategory: expense.subcategory,
    description: expense.description,
    date: expense.date,
    created_at: expense.createdAt,
    updated_at: expense.updatedAt,
  };
}

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedForUser = useRef<string | null>(null);

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
        return;
      }

      if (loadedForUser.current === user.id) return;
      loadedForUser.current = user.id;

      const { data, error: fetchError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setIsLoaded(true);
        return;
      }

      setExpenses((data as DbExpenseRow[]).map(rowToExpense));
      setIsLoaded(true);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [user]);

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
    (data: ExpenseFormData): { expense?: Expense; quotaExceeded?: boolean } => {
      const now = new Date().toISOString();
      const expense: Expense = {
        id: generateId(),
        date: data.date,
        amount: parseFloat(data.amount),
        category: data.category,
        subcategory: data.subcategory || "General",
        description: data.description.trim(),
        createdAt: now,
        updatedAt: now,
      };
      setExpenses((prev) => [expense, ...prev]);
      supabase
        .from("expenses")
        .insert(expenseToRow(expense, user!.id))
        .then(({ error: e }) => { if (e) setError(e.message); });
      return { expense };
    },
    [user]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseFormData): { quotaExceeded?: boolean } => {
      const updatedAt = new Date().toISOString();
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                date: data.date,
                amount: parseFloat(data.amount),
                category: data.category,
                subcategory: data.subcategory || "General",
                description: data.description.trim(),
                updatedAt,
              }
            : e
        )
      );
      supabase
        .from("expenses")
        .update({
          date: data.date,
          amount: parseFloat(data.amount),
          category: data.category,
          subcategory: data.subcategory || "General",
          description: data.description.trim(),
          updated_at: updatedAt,
        })
        .eq("id", id)
        .eq("user_id", user!.id)
        .then(({ error: e }) => { if (e) setError(e.message); });
      return {};
    },
    [user]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id)
        .then(({ error: e }) => { if (e) setError(e.message); });
    },
    [user]
  );

  const smartImportExpenses = useCallback(
    (backupExpenses: BackupExpense[]): { added: number; skipped: number; quotaExceeded?: boolean } => {
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
        supabase
          .from("expenses")
          .insert(rows)
          .then(({ error: e }) => { if (e) setError(e.message); });
      }
      return { added: toAdd.length, skipped: backupExpenses.length - toAdd.length };
    },
    [expenses, user]
  );

  const replaceAllExpenses = useCallback(
    (backupExpenses: BackupExpense[]): { quotaExceeded?: boolean } => {
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
      return {};
    },
    [user]
  );

  const bulkMigrateCategory = useCallback(
    (fromCategory: string, toCategory: string, toSubcategory: string) => {
      const now = new Date().toISOString();
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === fromCategory
            ? { ...e, category: toCategory, subcategory: toSubcategory, updatedAt: now }
            : e
        )
      );
      supabase
        .from("expenses")
        .update({ category: toCategory, subcategory: toSubcategory, updated_at: now })
        .eq("user_id", user!.id)
        .eq("category", fromCategory)
        .then(({ error: e }) => { if (e) setError(e.message); });
    },
    [user]
  );

  const bulkMigrateSubcategory = useCallback(
    (category: string, fromSubcategory: string, toSubcategory: string) => {
      const now = new Date().toISOString();
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === category && e.subcategory === fromSubcategory
            ? { ...e, subcategory: toSubcategory, updatedAt: now }
            : e
        )
      );
      supabase
        .from("expenses")
        .update({ subcategory: toSubcategory, updated_at: now })
        .eq("user_id", user!.id)
        .eq("category", category)
        .eq("subcategory", fromSubcategory)
        .then(({ error: e }) => { if (e) setError(e.message); });
    },
    [user]
  );

  const bulkRenameCategory = useCallback(
    (oldName: string, newName: string) => {
      const now = new Date().toISOString();
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === oldName
            ? { ...e, category: newName, updatedAt: now }
            : e
        )
      );
      supabase
        .from("expenses")
        .update({ category: newName, updated_at: now })
        .eq("user_id", user!.id)
        .eq("category", oldName)
        .then(({ error: e }) => { if (e) setError(e.message); });
    },
    [user]
  );

  const bulkRenameSubcategory = useCallback(
    (category: string, oldName: string, newName: string) => {
      const now = new Date().toISOString();
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === category && e.subcategory === oldName
            ? { ...e, subcategory: newName, updatedAt: now }
            : e
        )
      );
      supabase
        .from("expenses")
        .update({ subcategory: newName, updated_at: now })
        .eq("user_id", user!.id)
        .eq("category", category)
        .eq("subcategory", oldName)
        .then(({ error: e }) => { if (e) setError(e.message); });
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
    seedSampleData,
    isLoaded,
    error,
    stats,
  };
}

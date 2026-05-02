"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { Expense, ExpenseFilters, ExpenseFormData } from "@/types/expense";
import { useLocalStorage } from "./useLocalStorage";
import { generateSampleExpenses } from "@/utils/csv";

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
  const [expenses, setExpenses, isLoaded] = useLocalStorage<Expense[]>(
    "expenses",
    []
  );
  const [filters, setFilters] = useLocalStorage<ExpenseFilters>(
    "expense-filters",
    DEFAULT_FILTERS
  );

  // Migrate old expenses that lack a subcategory field
  const migrated = useRef(false);
  useEffect(() => {
    if (!isLoaded || migrated.current) return;
    migrated.current = true;
    const needsMigration = expenses.some((e) => !("subcategory" in e) || !e.subcategory);
    if (needsMigration) {
      setExpenses((prev) =>
        prev.map((e) => ({
          ...e,
          subcategory: e.subcategory || "General",
        }))
      );
    }
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [setExpenses]);

  const addExpense = useCallback(
    (data: ExpenseFormData) => {
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
      return expense;
    },
    [setExpenses]
  );

  const updateExpense = useCallback(
    (id: string, data: ExpenseFormData) => {
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
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
    },
    [setExpenses]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    },
    [setExpenses]
  );

  // Move all expenses of a deleted category to another category
  const bulkMigrateCategory = useCallback(
    (fromCategory: string, toCategory: string, toSubcategory: string) => {
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === fromCategory
            ? {
                ...e,
                category: toCategory,
                subcategory: toSubcategory,
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
    },
    [setExpenses]
  );

  // Move all expenses of a deleted subcategory to another subcategory within the same category
  const bulkMigrateSubcategory = useCallback(
    (category: string, fromSubcategory: string, toSubcategory: string) => {
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === category && e.subcategory === fromSubcategory
            ? {
                ...e,
                subcategory: toSubcategory,
                updatedAt: new Date().toISOString(),
              }
            : e
        )
      );
    },
    [setExpenses]
  );

  // Rename category across all expenses when a category name changes
  const bulkRenameCategory = useCallback(
    (oldName: string, newName: string) => {
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === oldName
            ? { ...e, category: newName, updatedAt: new Date().toISOString() }
            : e
        )
      );
    },
    [setExpenses]
  );

  // Rename subcategory across all expenses when a subcategory name changes
  const bulkRenameSubcategory = useCallback(
    (category: string, oldName: string, newName: string) => {
      setExpenses((prev) =>
        prev.map((e) =>
          e.category === category && e.subcategory === oldName
            ? { ...e, subcategory: newName, updatedAt: new Date().toISOString() }
            : e
        )
      );
    },
    [setExpenses]
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
    bulkMigrateCategory,
    bulkMigrateSubcategory,
    bulkRenameCategory,
    bulkRenameSubcategory,
    seedSampleData,
    isLoaded,
    stats,
  };
}

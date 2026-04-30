"use client";

import { useMemo, useCallback } from "react";
import { Expense, ExpenseFilters, ExpenseFormData, Category } from "@/types/expense";
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
        category: data.category as Category,
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
                category: data.category as Category,
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

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (filters.search) {
          const q = filters.search.toLowerCase();
          if (
            !e.description.toLowerCase().includes(q) &&
            !e.category.toLowerCase().includes(q)
          )
            return false;
        }
        if (filters.category !== "All" && e.category !== filters.category)
          return false;
        if (filters.dateFrom && e.date < filters.dateFrom) return false;
        if (filters.dateTo && e.date > filters.dateTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
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

    // Daily spending for the last 30 days
    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = 0;
    }
    expenses.forEach((e) => {
      if (dailyMap[e.date] !== undefined) {
        dailyMap[e.date] += e.amount;
      }
    });
    const daily = Object.entries(dailyMap).map(([date, amount]) => ({
      date,
      amount,
    }));

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
      monthlyCount: expenses.filter((e) => e.date.startsWith(currentMonth))
        .length,
      daily,
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
    seedSampleData,
    isLoaded,
    stats,
  };
}

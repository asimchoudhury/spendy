"use client";

import { Expense } from "@/types/expense";
import { ExpenseItem } from "./ExpenseItem";
import { Receipt } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isLoaded: boolean;
}

export function ExpenseList({ expenses, onEdit, onDelete, isLoaded }: ExpenseListProps) {
  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[72px] bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Receipt size={28} className="text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">No expenses found</p>
        <p className="text-gray-400 text-sm mt-1">
          Add your first expense or adjust your filters
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = expenses.reduce(
    (acc, e) => {
      if (!acc[e.date]) acc[e.date] = [];
      acc[e.date].push(e);
      return acc;
    },
    {} as Record<string, Expense[]>
  );

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatGroupDate = (date: string) => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (date === today) return "Today";
    if (date === yesterday) return "Yesterday";
    return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {sortedDates.map((date) => (
        <div key={date} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {formatGroupDate(date)}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">
              {grouped[date].length} item{grouped[date].length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {grouped[date].map((expense) => (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

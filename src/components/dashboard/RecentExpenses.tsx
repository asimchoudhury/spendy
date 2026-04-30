"use client";

import { Expense } from "@/types/expense";
import { formatCurrency } from "@/utils/currency";
import { CATEGORY_CONFIG } from "@/utils/categories";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RecentExpensesProps {
  expenses: Expense[];
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  const recent = expenses.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Recent Expenses
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Latest transactions</p>
        </div>
        <Link
          href="/expenses"
          className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No expenses yet
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((expense) => {
            const config = CATEGORY_CONFIG[expense.category];
            return (
              <div
                key={expense.id}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${config.bgColor}`}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">
                    {expense.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(parseISO(expense.date), "MMM d")}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 shrink-0">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

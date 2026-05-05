"use client";

import { Expense, CategoryData } from "@/types/expense";
import { formatCurrency } from "@/utils/currency";
import { getCategoryConfig } from "@/utils/categories";
import { CategoryBadge } from "@/components/ui/Badge";
import { Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ExpenseItemProps {
  expense: Expense;
  categories?: CategoryData[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseItem({ expense, categories, onEdit, onDelete }: ExpenseItemProps) {
  const config = getCategoryConfig(expense.category, categories);
  const formattedDate = format(parseISO(expense.date), "MMM d, yyyy");

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${config.bgColor}`}
      >
        {config.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {expense.description}
          </p>
          <span className="text-sm font-semibold text-gray-900 shrink-0">
            {formatCurrency(expense.amount)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <CategoryBadge category={expense.category} categories={categories} showIcon={false} />
          {expense.subcategory && expense.subcategory !== "General" && (
            <span className="text-xs text-gray-400">{expense.subcategory}</span>
          )}
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(expense)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

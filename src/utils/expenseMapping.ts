import { Expense } from "@/types/expense";

// Shape of a row in the Supabase `expenses` table. Shared by useExpenses (fetch +
// mutations) and the offline queue (replay), so the mapping lives in one place.
export type DbExpenseRow = {
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

export function rowToExpense(row: DbExpenseRow): Expense {
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

export function expenseToRow(expense: Expense, userId: string): DbExpenseRow {
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

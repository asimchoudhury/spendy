export interface Subcategory {
  id: string;
  name: string;
}

export interface CategoryData {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface Expense {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  category: string;
  subcategory: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  search: string;
  category: string; // "All" or a category name
  dateFrom: string;
  dateTo: string;
}

export interface ExpenseFormData {
  date: string;
  amount: string;
  category: string;
  subcategory: string;
  description: string;
}

// Represents an expense from a JSON backup file — id and timestamps may be absent in old exports
export interface BackupExpense {
  id?: string;
  date: string;
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

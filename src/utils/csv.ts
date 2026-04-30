import { Expense } from "@/types/expense";
import { formatCurrency } from "./currency";

export function exportToCSV(expenses: Expense[]): void {
  const headers = ["Date", "Description", "Category", "Amount (₹)"];
  const rows = expenses.map((e) => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    e.category,
    `"${formatCurrency(e.amount)}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateSampleExpenses(): Omit<
  Expense,
  "id" | "createdAt" | "updatedAt"
>[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return fmt(d);
  };

  return [
    { date: daysAgo(0), amount: 12.5, category: "Food", description: "Lunch at cafe" },
    { date: daysAgo(1), amount: 45.0, category: "Shopping", description: "Grocery shopping" },
    { date: daysAgo(2), amount: 9.99, category: "Entertainment", description: "Netflix subscription" },
    { date: daysAgo(3), amount: 35.0, category: "Transportation", description: "Uber to airport" },
    { date: daysAgo(4), amount: 120.0, category: "Bills", description: "Electricity bill" },
    { date: daysAgo(5), amount: 18.75, category: "Food", description: "Dinner takeout" },
    { date: daysAgo(7), amount: 55.0, category: "Shopping", description: "New shirt" },
    { date: daysAgo(8), amount: 6.5, category: "Food", description: "Morning coffee" },
    { date: daysAgo(10), amount: 80.0, category: "Bills", description: "Internet bill" },
    { date: daysAgo(12), amount: 25.0, category: "Entertainment", description: "Movie tickets" },
    { date: daysAgo(14), amount: 15.0, category: "Transportation", description: "Bus pass top-up" },
    { date: daysAgo(15), amount: 200.0, category: "Shopping", description: "Shoes" },
    { date: daysAgo(18), amount: 22.0, category: "Food", description: "Brunch with friends" },
    { date: daysAgo(20), amount: 40.0, category: "Other", description: "Haircut" },
    { date: daysAgo(22), amount: 300.0, category: "Bills", description: "Rent portion" },
  ];
}

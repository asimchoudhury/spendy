"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { MonthlySpendingChart } from "@/components/dashboard/MonthlySpendingChart";
import { MonthlyDonutChart } from "@/components/dashboard/MonthlyDonutChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { Plus, Sparkles, Download } from "lucide-react";
import { exportToCSV } from "@/utils/csv";

export default function DashboardPage() {
  const { expenses, addExpense, seedSampleData, isLoaded, stats } = useExpenses();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const { toasts, addToast, dismiss } = useToast();

  const handleAdd = (data: Parameters<typeof addExpense>[0]) => {
    addExpense(data);
    setShowForm(false);
    addToast("success", "Expense added successfully!");
  };

  const handleSeed = () => {
    seedSampleData();
    addToast("success", "Sample data loaded! Explore the dashboard.");
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoaded && expenses.length === 0
                ? "Welcome! Add your first expense or load sample data."
                : "Your financial overview"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isLoaded && expenses.length === 0 && (
              <button
                onClick={handleSeed}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 text-sm font-medium transition-colors"
              >
                <Sparkles size={15} />
                <span className="hidden sm:inline">Load Sample Data</span>
              </button>
            )}
            {isLoaded && expenses.length > 0 && (
              <button
                onClick={() => exportToCSV(expenses)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          </div>
        </div>

        {!isLoaded ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        ) : (
          <>
            <SummaryCards
              expenses={expenses}
              categories={categories}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SpendingChart expenses={expenses} />
              </div>
              <CategoryBreakdown
                expenses={expenses}
                categories={categories}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <MonthlySpendingChart expenses={expenses} />
              <MonthlyDonutChart expenses={expenses} categories={categories} />
            </div>

            <RecentExpenses expenses={expenses} categories={categories} />
          </>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Expense">
        <ExpenseForm
          categories={categories}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

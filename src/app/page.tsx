"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { StorageWarningBanner } from "@/components/storage/StorageWarningBanner";
import { StorageFullModal } from "@/components/storage/StorageFullModal";
import { getStorageUsage } from "@/utils/storage";
import { exportJSON } from "@/utils/exportFormats";
import { Plus, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { expenses, addExpense, seedSampleData, isLoaded, stats } = useExpenses();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [showStorageFull, setShowStorageFull] = useState(false);
  const [storagePercentage, setStoragePercentage] = useState(0);
  const { toasts, addToast, dismiss } = useToast();
  const router = useRouter();

  const refreshStorage = useCallback(() => {
    setStoragePercentage(getStorageUsage().percentage);
  }, []);

  // Check storage on load and whenever expenses change
  useEffect(() => {
    if (isLoaded) refreshStorage();
  }, [isLoaded, expenses, refreshStorage]);

  const handleAdd = (data: Parameters<typeof addExpense>[0]) => {
    const result = addExpense(data);
    if (result.quotaExceeded) {
      setShowStorageFull(true);
      // Form stays open — user's data is preserved
      return;
    }
    refreshStorage();
    setShowForm(false);
    addToast("success", "Expense added successfully!");
  };

  const handleSeed = () => {
    seedSampleData();
    refreshStorage();
    addToast("success", "Sample data loaded! Explore the dashboard.");
  };

  const handleExportJSON = () => {
    const today = new Date().toISOString().split("T")[0];
    exportJSON(expenses, `spendy-backup-${today}`);
  };

  const handleGoToExpenses = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("spendy-highlight-actions", "1");
    }
    router.push("/expenses");
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
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          </div>
        </div>

        {/* Storage warning — only shown at 90%+ */}
        {isLoaded && storagePercentage >= 90 && (
          <StorageWarningBanner
            percentage={storagePercentage}
            onExportJSON={handleExportJSON}
          />
        )}

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

      <StorageFullModal
        isOpen={showStorageFull}
        onClose={() => setShowStorageFull(false)}
        onExportJSON={handleExportJSON}
        onGoToExpenses={handleGoToExpenses}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

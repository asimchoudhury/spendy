"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseFiltersBar } from "@/components/expenses/ExpenseFilters";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { Expense, ExpenseFormData } from "@/types/expense";
import { exportToCSV } from "@/utils/csv";
import { formatCurrency } from "@/utils/currency";
import { Plus, Download, Trash2 } from "lucide-react";

export default function ExpensesPage() {
  const {
    filteredExpenses,
    expenses,
    filters,
    setFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    isLoaded,
  } = useExpenses();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toasts, addToast, dismiss } = useToast();

  const handleAdd = (data: ExpenseFormData) => {
    addExpense(data);
    setShowAddForm(false);
    addToast("success", "Expense added!");
  };

  const handleUpdate = (data: ExpenseFormData) => {
    if (!editingExpense) return;
    updateExpense(editingExpense.id, data);
    setEditingExpense(null);
    addToast("success", "Expense updated!");
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteExpense(deleteConfirm);
    setDeleteConfirm(null);
    addToast("success", "Expense deleted.");
  };

  const handleExport = () => {
    if (filteredExpenses.length === 0) {
      addToast("error", "No expenses to export.");
      return;
    }
    exportToCSV(filteredExpenses);
    addToast("success", `Exported ${filteredExpenses.length} expenses to CSV.`);
  };

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoaded
                ? `${expenses.length} total expense${expenses.length !== 1 ? "s" : ""}`
                : "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <ExpenseFiltersBar
            filters={filters}
            onChange={setFilters}
            count={filteredExpenses.length}
            total={filteredTotal}
          />
        </div>

        {/* Total for filtered results */}
        {isLoaded && filteredExpenses.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-gray-500">
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </span>
            <span className="text-sm font-semibold text-gray-900">
              Total: {formatCurrency(filteredTotal)}
            </span>
          </div>
        )}

        {/* List */}
        <ExpenseList
          expenses={filteredExpenses}
          onEdit={setEditingExpense}
          onDelete={handleDelete}
          isLoaded={isLoaded}
        />
      </div>

      {/* Add modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add Expense"
      >
        <ExpenseForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
      >
        {editingExpense && (
          <ExpenseForm
            initialData={editingExpense}
            onSubmit={handleUpdate}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Expense"
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Delete this expense?
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

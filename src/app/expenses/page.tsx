"use client";

import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseFiltersBar } from "@/components/expenses/ExpenseFilters";
import { Modal } from "@/components/ui/Modal";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { SmartImportModal } from "@/components/import/SmartImportModal";
import { Expense, ExpenseFormData } from "@/types/expense";
import { formatCurrency } from "@/utils/currency";
import { ExportModal } from "@/components/export/ExportModal";
import { exportJSON } from "@/utils/exportFormats";
import { useOffline, probeOnline } from "@/utils/connectivity";
import { Plus, Upload, Trash2, Download, FileJson } from "lucide-react";

export default function ExpensesPage() {
  const {
    filteredExpenses,
    expenses,
    filters,
    setFilters,
    addExpense,
    updateExpense,
    deleteExpense,
    smartImportExpenses,
    replaceAllExpenses,
    isLoaded,
  } = useExpenses();
  const { categories, importCategories } = useCategories();

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { toasts, addToast, dismiss } = useToast();
  const offline = useOffline();

  const handleAdd = (data: ExpenseFormData) => {
    const added = addExpense(data);
    setShowAddForm(false);
    if (added) addToast("success", "Expense added!");
  };

  const handleUpdate = (data: ExpenseFormData) => {
    if (!editingExpense) return;
    updateExpense(editingExpense.id, data);
    setEditingExpense(null);
    addToast("success", "Expense updated!");
  };

  const handleDelete = (id: string) => setDeleteConfirm(id);

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    deleteExpense(deleteConfirm);
    setDeleteConfirm(null);
    addToast("success", "Expense deleted.");
  };

  const handleExportJSON = () => {
    const today = new Date().toISOString().split("T")[0];
    exportJSON(expenses, `spendy-backup-${today}`);
  };

  // Export/Import both need a live connection (export reflects server data;
  // import writes to Supabase). Beyond the disabled-while-offline buttons, we do
  // a live reachability probe at click time so an action taken in the brief
  // window right after going offline (before navigator.onLine flips / the poll
  // runs) is still reliably denied.
  const ensureOnline = async (action: "export" | "import"): Promise<boolean> => {
    const reachable =
      offline || (typeof navigator !== "undefined" && navigator.onLine === false)
        ? false
        : await probeOnline();
    if (!reachable) {
      addToast(
        "error",
        action === "export"
          ? "You're offline — export needs an internet connection."
          : "You're offline — importing a backup needs an internet connection."
      );
    }
    return reachable;
  };

  const handleOpenExport = async () => {
    if (await ensureOnline("export")) setShowExport(true);
  };

  const handleOpenImport = async () => {
    if (await ensureOnline("import")) setShowImport(true);
  };

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isLoaded
                ? `${expenses.length} total expense${expenses.length !== 1 ? "s" : ""}`
                : "Loading..."}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <button
              onClick={handleOpenExport}
              disabled={offline}
              title={offline ? "Export is unavailable while you're offline" : "Export"}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleOpenImport}
                disabled={offline}
                title={offline ? "Importing a backup needs an internet connection" : "Import JSON Backup"}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-50"
              >
                <FileJson size={15} />
                <span className="hidden sm:inline">Import JSON Backup</span>
                <span className="sm:hidden">Import</span>
              </button>
              <p className="hidden sm:block text-[11px] text-gray-400 text-right pr-0.5">
                Restore a previously exported JSON backup
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Expense</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <ExpenseFiltersBar
            filters={filters}
            onChange={setFilters}
            categories={categories}
            count={filteredExpenses.length}
            total={filteredTotal}
          />
        </div>

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

        {/* True empty state with prominent import button */}
        {isLoaded && expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
              <FileJson size={28} className="text-gray-400" />
            </div>
            <div>
              <p className="text-gray-600 font-medium">No expenses yet.</p>
              <p className="text-gray-400 text-sm mt-1">
                Start adding expenses or restore from a JSON backup.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                <Plus size={16} />
                Add First Expense
              </button>
              <button
                onClick={handleOpenImport}
                disabled={offline}
                title={offline ? "Importing a backup needs an internet connection" : "Import JSON Backup"}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-50"
              >
                <Download size={16} />
                Import JSON Backup
              </button>
            </div>
          </div>
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            categories={categories}
            onEdit={setEditingExpense}
            onDelete={handleDelete}
            isLoaded={isLoaded}
          />
        )}
      </div>

      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Add Expense">
        <ExpenseForm
          categories={categories}
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
      >
        {editingExpense && (
          <ExpenseForm
            initialData={editingExpense}
            categories={categories}
            onSubmit={handleUpdate}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>

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
              <p className="text-sm font-medium text-gray-900">Delete this expense?</p>
              <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
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

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        expenses={expenses}
        categories={categories}
      />

      <SmartImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        currentExpenses={expenses}
        currentCategories={categories}
        onSmartImport={smartImportExpenses}
        onReplaceAll={replaceAllExpenses}
        onImportCategories={importCategories}
        onSuccess={(msg) => addToast("success", msg)}
        onError={(msg) => addToast("error", msg)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

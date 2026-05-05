"use client";

import { useState, useRef } from "react";
import { X, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Expense, BackupExpense, CategoryData } from "@/types/expense";
import { estimatePostImportPercentage } from "@/utils/storage";

interface SpendyBackup {
  generatedBy: string;
  exportedAt: string;
  expenses: BackupExpense[];
}

interface ImportPreview {
  backup: SpendyBackup;
  toAdd: BackupExpense[];
  toSkip: BackupExpense[];
  newCategoryNames: string[];
  estimatedPercentage: number;
}

interface SmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExpenses: Expense[];
  currentCategories: CategoryData[];
  onSmartImport: (
    backupExpenses: BackupExpense[]
  ) => { added: number; skipped: number; quotaExceeded?: boolean };
  onReplaceAll: (backupExpenses: BackupExpense[]) => { quotaExceeded?: boolean };
  onImportCategories: (categoryNames: string[]) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function validateBackup(raw: unknown): SpendyBackup {
  if (!raw || typeof raw !== "object") throw new Error("Not a valid JSON object");
  const obj = raw as Record<string, unknown>;
  if (obj.generatedBy !== "Spendy") throw new Error("Not a Spendy backup file");
  if (!Array.isArray(obj.expenses)) throw new Error("Missing expenses array");
  for (const e of obj.expenses) {
    if (!e || typeof e !== "object") throw new Error("Invalid expense entry");
    const exp = e as Record<string, unknown>;
    if (typeof exp.date !== "string" || !exp.date) throw new Error("Expense missing date");
    if (typeof exp.description !== "string") throw new Error("Expense missing description");
    if (typeof exp.category !== "string" || !exp.category) throw new Error("Expense missing category");
    if (typeof exp.amount !== "number" || isNaN(exp.amount)) throw new Error("Expense has invalid amount");
  }
  return obj as unknown as SpendyBackup;
}

function buildPreview(
  backup: SpendyBackup,
  currentExpenses: Expense[],
  currentCategories: CategoryData[]
): ImportPreview {
  const existingIds = new Set(currentExpenses.map((e) => e.id));
  const existingCategoryNames = new Set(currentCategories.map((c) => c.name));

  const toAdd = backup.expenses.filter((e) => !e.id || !existingIds.has(e.id));
  const toSkip = backup.expenses.filter((e) => e.id && existingIds.has(e.id));

  const backupCategoryNames = [...new Set(backup.expenses.map((e) => e.category))];
  const newCategoryNames = backupCategoryNames.filter((n) => !existingCategoryNames.has(n));

  const additionalJson = JSON.stringify(toAdd);
  const estimatedPercentage = estimatePostImportPercentage(additionalJson);

  return { backup, toAdd, toSkip, newCategoryNames, estimatedPercentage };
}

export function SmartImportModal({
  isOpen,
  onClose,
  currentExpenses,
  currentCategories,
  onSmartImport,
  onReplaceAll,
  onImportCategories,
  onSuccess,
  onError,
}: SmartImportModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        const backup = validateBackup(raw);
        setPreview(buildPreview(backup, currentExpenses, currentCategories));
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Could not read file"
        );
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleSmartImport = () => {
    if (!preview || isProcessing) return;
    setIsProcessing(true);

    if (preview.newCategoryNames.length > 0) {
      onImportCategories(preview.newCategoryNames);
    }

    const result = onSmartImport(preview.backup.expenses as BackupExpense[]);
    setIsProcessing(false);

    if (result.quotaExceeded) {
      onError("Storage is full. Delete some expenses first, then try importing again.");
      return;
    }

    onSuccess(
      `✅ Smart Import complete! Added ${result.added} new expense${result.added !== 1 ? "s" : ""}, skipped ${result.skipped} duplicate${result.skipped !== 1 ? "s" : ""}.`
    );
    handleClose();
  };

  const handleReplaceAll = () => {
    if (!preview || isProcessing) return;
    setIsProcessing(true);

    if (preview.newCategoryNames.length > 0) {
      onImportCategories(preview.newCategoryNames);
    }

    const result = onReplaceAll(preview.backup.expenses as BackupExpense[]);
    setIsProcessing(false);

    if (result.quotaExceeded) {
      onError("Storage is full. Free up space first.");
      setShowReplaceConfirm(false);
      return;
    }

    onSuccess(
      `✅ Data replaced successfully! Imported ${preview.backup.expenses.length} expense${preview.backup.expenses.length !== 1 ? "s" : ""} from backup.`
    );
    setShowReplaceConfirm(false);
    handleClose();
  };

  const handleClose = () => {
    setPreview(null);
    setParseError(null);
    setShowReplaceConfirm(false);
    setIsProcessing(false);
    onClose();
  };

  const formatDateRange = (expenses: BackupExpense[]) => {
    if (expenses.length === 0) return "—";
    const dates = expenses.map((e) => e.date).sort();
    const fmt = (d: string) =>
      new Date(d + "T12:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    return dates[0] === dates[dates.length - 1]
      ? fmt(dates[0])
      : `${fmt(dates[0])} – ${fmt(dates[dates.length - 1])}`;
  };

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {preview ? "Import Preview" : "Import JSON Backup"}
              </h2>
              {!preview && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Restore a previously exported Spendy JSON backup
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {!preview ? (
              /* File picker state */
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 w-full py-12 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 hover:bg-violet-100 hover:border-violet-400 transition-all text-center"
                >
                  <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
                    <Upload size={22} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-violet-700">
                      Click to select backup file
                    </p>
                    <p className="text-xs text-violet-500 mt-1">
                      Select a Spendy .json backup file
                    </p>
                  </div>
                </button>

                {parseError && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        ❌ Invalid backup file. Please select a valid Spendy JSON backup.
                      </p>
                      <p className="text-xs text-red-500 mt-1">{parseError}</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              /* Preview state */
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    This backup contains
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span>📅</span>
                      <span className="font-medium">Date range:</span>
                      <span>{formatDateRange(preview.backup.expenses)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span>🧾</span>
                      <span className="font-medium">Total expenses in backup:</span>
                      <span>{preview.backup.expenses.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-3">
                    Smart Import will
                  </p>
                  <div className="flex flex-col gap-2">
                    <Row icon="✅" label={`Add ${preview.toAdd.length} new expense${preview.toAdd.length !== 1 ? "s" : ""} not in Spendy`} />
                    <Row icon="⏭️" label={`Skip ${preview.toSkip.length} expense${preview.toSkip.length !== 1 ? "s" : ""} already in Spendy`} />
                    <Row icon="✅" label={`Keep all your ${currentExpenses.length} existing expense${currentExpenses.length !== 1 ? "s" : ""} safe`} />
                    <Row
                      icon="📂"
                      label={
                        preview.newCategoryNames.length > 0
                          ? `Add ${preview.newCategoryNames.length} new categor${preview.newCategoryNames.length !== 1 ? "ies" : "y"} from backup`
                          : "No new categories to add"
                      }
                    />
                    <Row
                      icon="💾"
                      label={`Storage after import: ~${Math.round(preview.estimatedPercentage)}% full`}
                    />
                  </div>
                </div>

                {preview.estimatedPercentage >= 90 && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      ⚠️ Storage will be ~{Math.round(preview.estimatedPercentage)}% full after import.
                      Consider deleting old expenses first.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => { setPreview(null); setParseError(null); }}
                  className="text-xs text-violet-600 hover:text-violet-800 text-center mt-1"
                >
                  ← Choose a different file
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {preview && (
            <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSmartImport}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 size={15} />
                Smart Import ✅
              </button>
              <button
                onClick={() => setShowReplaceConfirm(true)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50 transition-colors"
              >
                Replace All ⚠️
              </button>
              <button
                onClick={handleClose}
                className="sm:flex-none px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replace All confirmation modal */}
      {showReplaceConfirm && preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">⚠️ Replace All Data?</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 leading-relaxed">
                This will permanently{" "}
                <span className="font-semibold text-red-600">DELETE all your current expenses</span>{" "}
                and replace them with the backup data. This cannot be undone!
              </p>
              <div className="mt-4 flex flex-col gap-1.5 p-3 rounded-xl bg-gray-50 text-xs text-gray-600">
                <p>Current data: <strong>{currentExpenses.length} expenses</strong></p>
                <p>Backup data: <strong>{preview.backup.expenses.length} expenses</strong></p>
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-4 text-center">
                Are you absolutely sure?
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowReplaceConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReplaceAll}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Yes, Replace All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-700">
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

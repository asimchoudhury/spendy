"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  FileJson,
  Printer,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Tag,
} from "lucide-react";
import { Expense, CategoryData } from "@/types/expense";
import { formatCurrency } from "@/utils/currency";
import { exportCSV, exportJSON, exportPDF } from "@/utils/exportFormats";

type ExportFormat = "csv" | "json" | "pdf";

interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
  ext: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  hint: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "csv",
    label: "CSV",
    description: "Spreadsheet",
    ext: ".csv",
    Icon: FileSpreadsheet,
    hint: "Opens in Excel, Google Sheets, or any spreadsheet app.",
  },
  {
    value: "json",
    label: "JSON",
    description: "Structured data",
    ext: ".json",
    Icon: FileJson,
    hint: "Includes summary statistics and category breakdown. Great for developers.",
  },
  {
    value: "pdf",
    label: "PDF",
    description: "Print-ready",
    ext: ".pdf",
    Icon: Printer,
    hint: "Opens a formatted report in a new window, ready to print or save as PDF.",
  },
];

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  categories: CategoryData[];
}

export function ExportModal({
  isOpen,
  onClose,
  expenses,
  categories,
}: ExportModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split("T")[0];

  const [format, setFormat] = useState<ExportFormat>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [filename, setFilename] = useState(`expenses-${today}`);
  const [showPreview, setShowPreview] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const allCategoryNames = useMemo(
    () => categories.map((c) => c.name),
    [categories]
  );

  const wasOpen = useRef(false);

  // Reset and initialize every time the modal opens
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setFormat("csv");
      setDateFrom("");
      setDateTo("");
      setSelectedCategories(new Set(categories.map((c) => c.name)));
      setFilename(`expenses-${today}`);
      setShowPreview(true);
      setIsExporting(false);
      setExportStatus("idle");
    }
    wasOpen.current = isOpen;
  }, [isOpen, categories, today]);

  // Keyboard + body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        if (
          selectedCategories.size > 0 &&
          selectedCategories.size < allCategoryNames.length &&
          !selectedCategories.has(e.category)
        )
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
      );
  }, [expenses, dateFrom, dateTo, selectedCategories, allCategoryNames.length]);

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((s, e) => s + e.amount, 0),
    [filteredExpenses]
  );

  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [filteredExpenses]);

  const toggleCategory = useCallback((name: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const allSelected = selectedCategories.size === allCategoryNames.length;
  const noneSelected =
    selectedCategories.size === 0 && allCategoryNames.length > 0;

  const toggleAllCategories = useCallback(() => {
    if (allSelected) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(allCategoryNames));
    }
  }, [allSelected, allCategoryNames]);

  const currentFmt = FORMAT_OPTIONS.find((f) => f.value === format)!;
  const previewRows = filteredExpenses.slice(0, 7);
  const previewRemainder = filteredExpenses.length - previewRows.length;

  const handleExport = async () => {
    if (filteredExpenses.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportStatus("idle");

    const fname = (filename.trim() || `expenses-${today}`);

    await new Promise((r) => setTimeout(r, 700));

    try {
      if (format === "csv") exportCSV(filteredExpenses, fname);
      else if (format === "json") exportJSON(filteredExpenses, fname);
      else exportPDF(filteredExpenses, fname);
      setExportStatus("success");
    } catch {
      setExportStatus("error");
    } finally {
      setIsExporting(false);
    }

    setTimeout(() => setExportStatus("idle"), 4000);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[96dvh] sm:max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

        {/* ── Header ── */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Export Expenses
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Choose format, filter your data, preview, then download.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="px-6 py-5 flex flex-col gap-7">

            {/* Format Cards */}
            <section>
              <SectionLabel icon={<Download size={12} />} text="Export Format" />
              <div className="grid grid-cols-3 gap-3 mt-3">
                {FORMAT_OPTIONS.map((opt) => {
                  const active = format === opt.value;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFormat(opt.value)}
                      className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-150 text-center ${
                        active
                          ? "border-violet-500 bg-violet-50 shadow-sm shadow-violet-100"
                          : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          active
                            ? "bg-violet-600"
                            : "bg-gray-100 group-hover:bg-violet-100"
                        }`}
                      >
                        <Icon
                          size={18}
                          className={
                            active
                              ? "text-white"
                              : "text-gray-500 group-hover:text-violet-600"
                          }
                        />
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold leading-none ${
                            active ? "text-violet-700" : "text-gray-800"
                          }`}
                        >
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {opt.description}
                        </p>
                      </div>
                      {active && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-xs text-gray-400 leading-relaxed">
                {currentFmt.hint}
              </p>
            </section>

            {/* Date Range */}
            <section>
              <SectionLabel
                icon={<Calendar size={12} />}
                text="Date Range"
                action={
                  (dateFrom || dateTo) ? (
                    <button
                      onClick={() => { setDateFrom(""); setDateTo(""); }}
                      className="text-xs text-violet-600 hover:text-violet-800"
                    >
                      Clear
                    </button>
                  ) : undefined
                }
              />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-400 transition-colors bg-white"
                  />
                </div>
              </div>
              {!dateFrom && !dateTo && (
                <p className="text-[11px] text-gray-400 mt-2">
                  No date range set — all dates will be included.
                </p>
              )}
            </section>

            {/* Category Filter */}
            <section>
              <SectionLabel
                icon={<Tag size={12} />}
                text="Categories"
                action={
                  <button
                    onClick={toggleAllCategories}
                    className="text-xs text-violet-600 hover:text-violet-800"
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                }
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {categories.map((cat) => {
                  const checked = selectedCategories.has(cat.name);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-100 ${
                        checked
                          ? `${cat.bgColor} ${cat.textColor} border-transparent`
                          : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm leading-none">{cat.icon}</span>
                      {cat.name}
                      {checked && categoryTotals[cat.name] ? (
                        <span className="opacity-60 font-normal">
                          {formatCurrency(categoryTotals[cat.name])}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {noneSelected && (
                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-amber-600">
                  <AlertCircle size={12} />
                  No categories selected — zero records will be exported.
                </div>
              )}
            </section>

            {/* Filename */}
            <section>
              <SectionLabel icon={null} text="Filename" />
              <div className="flex items-stretch mt-3 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-400 transition-all">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={`expenses-${today}`}
                  className="flex-1 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none placeholder:text-gray-300"
                />
                <div className="px-3 py-2.5 bg-gray-50 border-l border-gray-200 text-sm text-gray-500 font-mono flex items-center">
                  {currentFmt.ext}
                </div>
              </div>
            </section>

            {/* Preview */}
            <section>
              <button
                onClick={() => setShowPreview((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Preview
                  </span>
                  <span className="text-xs text-gray-400">
                    — {filteredExpenses.length}{" "}
                    {filteredExpenses.length === 1 ? "record" : "records"} selected
                  </span>
                </div>
                {showPreview ? (
                  <ChevronUp size={14} className="text-gray-400" />
                ) : (
                  <ChevronDown size={14} className="text-gray-400" />
                )}
              </button>

              {showPreview && (
                <div className="mt-2 rounded-2xl border border-gray-100 overflow-hidden">
                  {filteredExpenses.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-400">
                      <div className="text-2xl mb-2">🔍</div>
                      No records match the current filters.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px]">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                Date
                              </th>
                              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                Description
                              </th>
                              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                Category
                              </th>
                              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((e, idx) => (
                              <tr
                                key={e.id}
                                className={
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                }
                              >
                                <td className="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">
                                  {e.date}
                                </td>
                                <td className="px-4 py-2.5 text-xs text-gray-700 max-w-[180px] truncate">
                                  {e.description}
                                </td>
                                <td className="px-4 py-2.5">
                                  {(() => {
                                    const cat = categories.find(
                                      (c) => c.name === e.category
                                    );
                                    return (
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cat?.bgColor ?? "bg-gray-100"} ${cat?.textColor ?? "text-gray-600"}`}
                                      >
                                        {cat?.icon} {e.category}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="px-4 py-2.5 text-xs font-bold text-gray-900 text-right whitespace-nowrap">
                                  {formatCurrency(e.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {previewRemainder > 0 && (
                        <div className="px-4 py-2.5 text-center text-[11px] text-gray-400 bg-gray-50 border-t border-gray-100">
                          +{previewRemainder} more{" "}
                          {previewRemainder === 1 ? "record" : "records"} not
                          shown in preview
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-gray-100 px-6 pt-4 pb-6">
          {/* Summary bar */}
          <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-gray-50 rounded-2xl">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-gray-900 leading-none">
                {filteredExpenses.length}
              </span>
              <span className="text-xs text-gray-500">
                {filteredExpenses.length === 1 ? "record" : "records"}
              </span>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </span>
              <span className="text-xs text-gray-500">total</span>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium">
              {currentFmt.label} format
            </span>

            {exportStatus === "success" && (
              <>
                <div className="w-px h-5 bg-gray-200" />
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle2 size={12} />
                  Downloaded!
                </span>
              </>
            )}
            {exportStatus === "error" && (
              <>
                <div className="w-px h-5 bg-gray-200" />
                <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                  <AlertCircle size={12} />
                  Export failed
                </span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-none px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={filteredExpenses.length === 0 || isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:bg-violet-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
            >
              {isExporting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Preparing export…
                </>
              ) : (
                <>
                  <Download size={15} />
                  Export {filteredExpenses.length}{" "}
                  {filteredExpenses.length === 1 ? "record" : "records"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({
  icon,
  text,
  action,
}: {
  icon: React.ReactNode;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {text}
        </span>
      </div>
      {action}
    </div>
  );
}

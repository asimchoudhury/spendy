"use client";

import { useState, useMemo } from "react";
import { format, subMonths, addMonths } from "date-fns";
import { formatCurrency } from "@/utils/currency";
import { getCategoryConfig } from "@/utils/categories";
import { CategoryData, Expense } from "@/types/expense";
import { TIME_RANGE_OPTIONS, TimeRange, filterByRange, getStartDateStr } from "@/utils/dateRange";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Tag,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SummaryCardsProps {
  expenses: Expense[];
  categories?: CategoryData[];
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getRangeLabel(range: TimeRange): string {
  if (range === "all") return "All time total";
  if (range === "1y") return "Last 1 year";
  if (range === "6m") return "Last 6 months";
  return "Last 3 months";
}

function TimeRangeToggle({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 bg-white/20 rounded-lg p-0.5 mt-2.5">
      {TIME_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={(e) => { e.stopPropagation(); onChange(opt.value); }}
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${
            value === opt.value
              ? "bg-white/30 text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SummaryCards({ expenses, categories }: SummaryCardsProps) {
  const [totalRange, setTotalRange] = useState<TimeRange>("all");
  const [topCatRange, setTopCatRange] = useState<TimeRange>("all");

  const now = new Date();
  const [monthKey, setMonthKey] = useState(toMonthKey(now));
  const isCurrentMonth = monthKey === toMonthKey(now);

  // Card 1 — filtered total
  const filteredTotal = useMemo(() => {
    return filterByRange(expenses, totalRange).reduce((s, e) => s + e.amount, 0);
  }, [expenses, totalRange]);

  // Card 2 — this month (static)
  const { monthly, lastMonthTotal, monthlyCount } = useMemo(() => {
    const currentMonth = toMonthKey(now);
    const lastMonth = toMonthKey(subMonths(now, 1));
    return {
      monthly: expenses.filter((e) => e.date.startsWith(currentMonth)).reduce((s, e) => s + e.amount, 0),
      lastMonthTotal: expenses.filter((e) => e.date.startsWith(lastMonth)).reduce((s, e) => s + e.amount, 0),
      monthlyCount: expenses.filter((e) => e.date.startsWith(currentMonth)).length,
    };
  }, [expenses]); // eslint-disable-line react-hooks/exhaustive-deps

  // Card 3 — top category filtered
  const { topCategory, topCategoryAmount } = useMemo(() => {
    const filtered = filterByRange(expenses, topCatRange);
    const byCategory = filtered.reduce(
      (acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; },
      {} as Record<string, number>
    );
    const top = Object.entries(byCategory).sort(([, a], [, b]) => b - a)[0];
    return { topCategory: top?.[0] ?? null, topCategoryAmount: top?.[1] ?? 0 };
  }, [expenses, topCatRange]);

  // Card 4 — selected month count
  const selectedMonthCount = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith(monthKey)).length;
  }, [expenses, monthKey]);

  const monthDiff = monthly - lastMonthTotal;
  const monthPct = lastMonthTotal > 0 ? Math.abs((monthDiff / lastMonthTotal) * 100).toFixed(0) : null;
  const topCatConfig = topCategory ? getCategoryConfig(topCategory, categories) : null;

  const goPrevMonth = () => {
    setMonthKey((m) => toMonthKey(subMonths(new Date(m + "-01"), 1)));
  };
  const goNextMonth = () => {
    if (!isCurrentMonth) setMonthKey((m) => toMonthKey(addMonths(new Date(m + "-01"), 1)));
  };
  const displayMonth = format(new Date(monthKey + "-01"), "MMMM yyyy");

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Spent */}
      <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Total Spent</p>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign size={16} className="text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-0">{formatCurrency(filteredTotal)}</p>
        <TimeRangeToggle value={totalRange} onChange={setTotalRange} />
        <p className="text-xs text-white/70 mt-1.5">{getRangeLabel(totalRange)}</p>
      </div>

      {/* Card 2: This Month (unchanged) */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider">This Month</p>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <Calendar size={16} className="text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-1">{formatCurrency(monthly)}</p>
        <p className="text-xs text-white/70">
          {monthPct !== null ? (
            <span className="flex items-center gap-1">
              {monthDiff >= 0 ? (
                <TrendingUp size={12} className="text-red-300" />
              ) : (
                <TrendingDown size={12} className="text-emerald-300" />
              )}
              {monthPct}% vs last month
            </span>
          ) : (
            `${monthlyCount} expense${monthlyCount !== 1 ? "s" : ""} this month`
          )}
        </p>
      </div>

      {/* Card 3: Top Category */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Top Category</p>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <Tag size={16} className="text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-0 truncate">
          {topCategory ? `${topCatConfig?.icon} ${topCategory}` : "—"}
        </p>
        <TimeRangeToggle value={topCatRange} onChange={setTopCatRange} />
        <p className="text-xs text-white/70 mt-1.5">
          {topCategory ? `${formatCurrency(topCategoryAmount)} spent` : "No data yet"}
        </p>
      </div>

      {/* Card 4: Monthly Count */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Monthly Count</p>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
            <Receipt size={16} className="text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-0">{selectedMonthCount}</p>
        <div className="flex items-center gap-1 mt-2.5">
          <button
            onClick={goPrevMonth}
            className="p-0.5 rounded text-white/70 hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="text-[10px] text-white/90 flex-1 text-center font-medium">{displayMonth}</span>
          <button
            onClick={goNextMonth}
            disabled={isCurrentMonth}
            className="p-0.5 rounded text-white/70 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight size={13} />
          </button>
        </div>
        <p className="text-xs text-white/70 mt-1.5">
          Transactions in {format(new Date(monthKey + "-01"), "MMM yyyy")}
        </p>
      </div>
    </div>
  );
}

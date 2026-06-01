"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, addMonths, subMonths } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/utils/currency";
import { Expense, CategoryData } from "@/types/expense";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimeRange, TIME_RANGE_OPTIONS, filterByRange } from "@/utils/dateRange";

interface SubcategoryBreakdownProps {
  category: CategoryData | null;
  expenses: Expense[];
  onClose: () => void;
  /** When provided, the modal shows a month navigator starting at this month key (YYYY-MM). */
  initialMonthKey?: string;
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface TooltipEntry { value: number }
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function SubcategoryBreakdown({
  category,
  expenses,
  onClose,
  initialMonthKey,
}: SubcategoryBreakdownProps) {
  const isMonthMode = initialMonthKey !== undefined;

  // Period mode state
  const [range, setRange] = useState<TimeRange>("all");

  // Month mode state
  const [monthKey, setMonthKey] = useState(initialMonthKey ?? toMonthKey(new Date()));
  const now = new Date();
  const isCurrentMonth = monthKey === toMonthKey(now);

  const goBack = () => setMonthKey((m) => toMonthKey(subMonths(new Date(m + "-01"), 1)));
  const goForward = () => {
    if (isCurrentMonth) return;
    setMonthKey((m) => toMonthKey(addMonths(new Date(m + "-01"), 1)));
  };

  const { chartData, chartTotal } = useMemo(() => {
    if (!category) return { chartData: [], chartTotal: 0 };

    const catExpenses = expenses.filter((e) => e.category === category.name);
    const filtered = isMonthMode
      ? catExpenses.filter((e) => e.date.startsWith(monthKey))
      : filterByRange(catExpenses, range);

    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      const sub = e.subcategory || "General";
      map[sub] = (map[sub] || 0) + e.amount;
    });

    const chartData = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { chartData, chartTotal: chartData.reduce((s, d) => s + d.value, 0) };
  }, [category, expenses, range, monthKey, isMonthMode]);

  const displayMonth = format(new Date(monthKey + "-01"), "MMMM yyyy");

  if (!category) return null;

  return (
    <Modal
      isOpen={!!category}
      onClose={onClose}
      title={`${category.icon} ${category.name} — Subcategory Breakdown`}
    >
      <div className="flex flex-col gap-5">
        {/* Selector row: month navigator OR period tabs */}
        <div className="flex items-center justify-between gap-2">
          {isMonthMode ? (
            <div className="flex items-center gap-1">
              <button
                onClick={goBack}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-medium text-gray-700 min-w-[90px] text-center">
                {displayMonth}
              </span>
              <button
                onClick={goForward}
                disabled={isCurrentMonth}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {TIME_RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${
                    range === opt.value
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(chartTotal)}
          </span>
        </div>

        {/* Bar chart or empty state */}
        {chartData.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-xl">
            {isMonthMode ? `No expenses in ${displayMonth}` : "No expenses in this period"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={category.color} fillOpacity={0.8 - i * 0.1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* Breakdown table */}
        {chartData.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Breakdown
            </p>
            {chartData.map((row, i) => {
              const pct = chartTotal > 0 ? (row.value / chartTotal) * 100 : 0;
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{row.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(row.value)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: category.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { format, addMonths, subMonths } from "date-fns";
import { formatCurrency } from "@/utils/currency";
import { getCategoryConfig } from "@/utils/categories";
import { Expense, CategoryData } from "@/types/expense";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyDonutChartProps {
  expenses: Expense[];
  categories?: CategoryData[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{name}</p>
      <p className="text-sm font-semibold text-gray-900">{formatCurrency(value)}</p>
    </div>
  );
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthlyDonutChart({ expenses, categories }: MonthlyDonutChartProps) {
  const now = new Date();
  const [monthKey, setMonthKey] = useState(toMonthKey(now));

  const isCurrentMonth = monthKey === toMonthKey(now);

  const goBack = () => {
    const d = new Date(monthKey + "-01");
    setMonthKey(toMonthKey(subMonths(d, 1)));
  };
  const goForward = () => {
    if (isCurrentMonth) return;
    const d = new Date(monthKey + "-01");
    setMonthKey(toMonthKey(addMonths(d, 1)));
  };

  const { data, total } = useMemo(() => {
    const byCategory: Record<string, number> = {};
    expenses
      .filter((e) => e.date.startsWith(monthKey))
      .forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });
    const entries = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const total = entries.reduce((s, e) => s + e.value, 0);
    return { data: entries, total };
  }, [expenses, monthKey]);

  const hasData = data.length > 0;
  const displayMonth = format(new Date(monthKey + "-01"), "MMMM yyyy");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Category Breakdown</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {hasData ? formatCurrency(total) + " this month" : "No data"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium text-gray-700 min-w-[90px] text-center">
            {displayMonth}
          </span>
          <button
            onClick={goForward}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          No spending in {displayMonth}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry) => {
                  const config = getCategoryConfig(entry.name, categories);
                  return (
                    <Cell key={entry.name} fill={config.color} stroke="transparent" />
                  );
                })}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="w-full flex flex-col gap-2 mt-1">
            {data.map((entry) => {
              const config = getCategoryConfig(entry.name, categories);
              const pct = total > 0 ? (entry.value / total) * 100 : 0;
              return (
                <div key={entry.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-gray-700 truncate">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{pct.toFixed(0)}%</span>
                    <span className="text-xs font-medium text-gray-700">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

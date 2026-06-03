"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { format, addMonths, subMonths } from "date-fns";
import { formatCurrency } from "@/utils/currency";
import { getCategoryConfig } from "@/utils/categories";
import { Expense, CategoryData } from "@/types/expense";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SubcategoryBreakdown } from "./SubcategoryBreakdown";
import { toMonthKey } from "@/utils/dateRange";

interface MonthlyDonutChartProps {
  expenses: Expense[];
  categories?: CategoryData[];
}

interface TooltipEntry { payload: { name: string; value: number } }
function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{name}</p>
      <p className="text-sm font-semibold text-gray-900">{formatCurrency(value)}</p>
    </div>
  );
}


export function MonthlyDonutChart({ expenses, categories }: MonthlyDonutChartProps) {
  const now = new Date();
  const [monthKey, setMonthKey] = useState(toMonthKey(now));
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  const isCurrentMonth = monthKey === toMonthKey(now);

  const goBack = () => {
    const d = new Date(monthKey + "-01");
    setMonthKey(toMonthKey(subMonths(d, 1)));
    setSelectedCategory(null);
  };
  const goForward = () => {
    if (isCurrentMonth) return;
    const d = new Date(monthKey + "-01");
    setMonthKey(toMonthKey(addMonths(d, 1)));
    setSelectedCategory(null);
  };

  const handleCategoryClick = (name: string) => {
    const cat = categories?.find((c) => c.name === name);
    if (cat) setSelectedCategory(cat);
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
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Monthly Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasData ? `${formatCurrency(total)} · click a category for details` : "No data"}
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
                  onClick={(entry) => entry.name && handleCategoryClick(entry.name as string)}
                  style={{ cursor: "pointer" }}
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
                  <button
                    key={entry.name}
                    onClick={() => handleCategoryClick(entry.name)}
                    className="flex flex-col gap-1 w-full text-left hover:bg-gray-50 rounded-lg px-1 py-0.5 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{config.icon}</span>
                        <span className="text-xs text-gray-700 group-hover:text-violet-700 transition-colors">
                          {entry.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                        <span className="text-xs font-medium text-gray-600">
                          {formatCurrency(entry.value)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: config.color }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <SubcategoryBreakdown
        key={`${selectedCategory?.id ?? "none"}-${monthKey}`}
        category={selectedCategory}
        expenses={expenses}
        onClose={() => setSelectedCategory(null)}
        initialMonthKey={monthKey}
      />
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/currency";
import { getCategoryConfig } from "@/utils/categories";
import { Expense, CategoryData } from "@/types/expense";
import { SubcategoryBreakdown } from "./SubcategoryBreakdown";
import { TimeRange, TIME_RANGE_OPTIONS, filterByRange, getDateRangeLabel } from "@/utils/dateRange";

interface CategoryBreakdownProps {
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

export function CategoryBreakdown({ expenses, categories }: CategoryBreakdownProps) {
  const [range, setRange] = useState<TimeRange>("all");
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  const { data, total } = useMemo(() => {
    const filtered = filterByRange(expenses, range);
    const byCategory = filtered.reduce(
      (acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; },
      {} as Record<string, number>
    );
    const entries = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return { data: entries, total: entries.reduce((s, d) => s + d.value, 0) };
  }, [expenses, range]);

  const hasData = data.length > 0;
  const dateRangeLabel = getDateRangeLabel(range);

  const handleCategoryClick = (name: string) => {
    const cat = categories?.find((c) => c.name === name);
    if (cat) setSelectedCategory(cat);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">By Category</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {dateRangeLabel} · click a category for details
              </p>
            </div>
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
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
          </div>
        </div>

        {!hasData ? (
          <div className="h-48 flex items-center justify-center text-sm text-gray-400">
            No data to display yet
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  onClick={(entry) => entry.name && handleCategoryClick(entry.name as string)}
                  style={{ cursor: "pointer" }}
                >
                  {data.map((entry) => {
                    const config = getCategoryConfig(entry.name, categories);
                    return <Cell key={entry.name} fill={config.color} stroke="transparent" />;
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full flex flex-col gap-2 mt-2">
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
        category={selectedCategory}
        expenses={expenses}
        onClose={() => setSelectedCategory(null)}
      />
    </>
  );
}

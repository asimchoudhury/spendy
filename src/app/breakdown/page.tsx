"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, addMonths, subYears } from "date-fns";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/utils/currency";
import { Expense } from "@/types/expense";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "monthly" | "period";
type PeriodRange = "3m" | "6m" | "1y";

const SUBCAT_COLORS = [
  "#7c3aed", "#4f46e5", "#0ea5e9", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#06b6d4",
  "#84cc16", "#f97316",
];

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getPeriodStart(range: PeriodRange): Date {
  const now = new Date();
  if (range === "3m") return subMonths(now, 3);
  if (range === "6m") return subMonths(now, 6);
  return subYears(now, 1);
}

function getPeriodDateLabel(range: PeriodRange): string {
  const now = new Date();
  const start = getPeriodStart(range);
  return `${format(start, "MMM yyyy")} — ${format(now, "MMM yyyy")}`;
}

interface SubcategorySlice {
  name: string;
  value: number;
  pct: number;
  color: string;
}

interface DonutCardProps {
  categoryName: string;
  categoryIcon: string;
  subcategoryData: SubcategorySlice[];
  total: number;
  periodLabel: string;
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }> }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{name}</p>
      <p className="text-sm font-semibold text-gray-900">{formatCurrency(value)}</p>
    </div>
  );
}

function DonutCard({ categoryName, categoryIcon, subcategoryData, total, periodLabel }: DonutCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{categoryIcon}</span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{categoryName}</h3>
          <p className="text-xs text-gray-500">{periodLabel}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={subcategoryData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {subcategoryData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-3 overflow-y-auto max-h-52">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left pb-1.5 font-medium">Subcategory</th>
              <th className="text-right pb-1.5 font-medium">%</th>
              <th className="text-right pb-1.5 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {subcategoryData.map((row) => (
              <tr key={row.name} className="border-b border-gray-50 last:border-0">
                <td className="py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="text-gray-700">{row.name}</span>
                  </div>
                </td>
                <td className="py-1.5 text-right text-gray-400">{row.pct.toFixed(1)}%</td>
                <td className="py-1.5 text-right font-medium text-gray-700">
                  {formatCurrency(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="pt-2 font-semibold text-gray-900">Total</td>
              <td className="pt-2 text-right font-semibold text-gray-900">100%</td>
              <td className="pt-2 text-right font-semibold text-gray-900">
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function buildCards(
  expenses: Expense[],
  categories: Array<{ name: string; icon: string; color: string }>,
  periodLabel: string
): DonutCardProps[] {
  const cards: DonutCardProps[] = [];
  for (const cat of categories) {
    const catExpenses = expenses.filter((e) => e.category === cat.name);
    if (catExpenses.length === 0) continue;

    const subMap: Record<string, number> = {};
    catExpenses.forEach((e) => {
      const sub = e.subcategory || "General";
      subMap[sub] = (subMap[sub] || 0) + e.amount;
    });

    const subs = Object.entries(subMap)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (subs.length < 2) continue;

    const total = subs.reduce((s, d) => s + d.value, 0);
    const subcategoryData: SubcategorySlice[] = subs.map((s, i) => ({
      name: s.name,
      value: s.value,
      pct: total > 0 ? (s.value / total) * 100 : 0,
      color: SUBCAT_COLORS[i % SUBCAT_COLORS.length],
    }));

    cards.push({ categoryName: cat.name, categoryIcon: cat.icon, subcategoryData, total, periodLabel });
  }
  return cards;
}

export default function BreakdownPage() {
  const { expenses, isLoaded } = useExpenses();
  const { categories } = useCategories();
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [periodRange, setPeriodRange] = useState<PeriodRange>("3m");

  const now = new Date();
  const [monthKey, setMonthKey] = useState(toMonthKey(now));
  const isCurrentMonth = monthKey === toMonthKey(now);

  const goPrevMonth = () =>
    setMonthKey((m) => toMonthKey(subMonths(new Date(m + "-01"), 1)));
  const goNextMonth = () => {
    if (!isCurrentMonth) setMonthKey((m) => toMonthKey(addMonths(new Date(m + "-01"), 1)));
  };

  const periodDateLabel = getPeriodDateLabel(periodRange);
  const periodRangeLabel =
    periodRange === "3m" ? "Last 3 Months" : periodRange === "6m" ? "Last 6 Months" : "Last 1 Year";

  const cards = useMemo(() => {
    if (!isLoaded) return [];
    if (viewMode === "monthly") {
      const filtered = expenses.filter((e) => e.date.startsWith(monthKey));
      const label = format(new Date(monthKey + "-01"), "MMMM yyyy");
      return buildCards(filtered, categories, label);
    } else {
      const startStr = getPeriodStart(periodRange).toISOString().split("T")[0];
      const filtered = expenses.filter((e) => e.date >= startStr);
      return buildCards(filtered, categories, periodRangeLabel);
    }
  }, [expenses, categories, viewMode, monthKey, periodRange, isLoaded, periodRangeLabel]);

  const emptyMessage =
    viewMode === "monthly"
      ? "No breakdown available for this month. Try a different month or add more subcategories."
      : "No breakdown available for this period. Try a different period or add more subcategories.";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Breakdown</h1>
        <p className="text-sm text-gray-500 mt-0.5">Subcategory breakdown by category</p>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["monthly", "period"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === mode
                ? "bg-white text-violet-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {mode === "monthly" ? "Monthly View" : "Period View"}
          </button>
        ))}
      </div>

      {/* Controls */}
      {viewMode === "monthly" ? (
        <div className="flex items-center gap-1 w-fit bg-white border border-gray-200 rounded-xl px-2 py-1.5">
          <button
            onClick={goPrevMonth}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[110px] text-center">
            {format(new Date(monthKey + "-01"), "MMMM yyyy")}
          </span>
          <button
            onClick={goNextMonth}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(["3m", "6m", "1y"] as PeriodRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setPeriodRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  periodRange === r
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {r === "3m" ? "3 Months" : r === "6m" ? "6 Months" : "1 Year"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">{periodDateLabel}</p>
        </div>
      )}

      {/* Grid */}
      {!isLoaded ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">
            📊
          </div>
          <p className="text-gray-600 font-medium">No breakdown available</p>
          <p className="text-gray-400 text-sm max-w-xs">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card) => (
            <DonutCard key={card.categoryName} {...card} />
          ))}
        </div>
      )}
    </div>
  );
}

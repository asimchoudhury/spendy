"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, addMonths, subMonths, getDaysInMonth } from "date-fns";
import { formatCurrency } from "@/utils/currency";
import { Expense } from "@/types/expense";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlySpendingChartProps {
  expenses: Expense[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">
        {format(parseISO(label), "MMM d, yyyy")}
      </p>
      <p className="text-sm font-semibold text-gray-900">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthlySpendingChart({ expenses }: MonthlySpendingChartProps) {
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

  const data = useMemo(() => {
    const ref = new Date(monthKey + "-01");
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const daysInMonth = getDaysInMonth(ref);
    const map: Record<string, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      map[key] = 0;
    }
    expenses.forEach((e) => {
      if (map[e.date] !== undefined) map[e.date] += e.amount;
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  }, [expenses, monthKey]);

  const hasData = data.some((d) => d.amount > 0);
  const monthTotal = data.reduce((s, d) => s + d.amount, 0);

  const tickFormatter = (date: string, index: number) => {
    if (index % 7 !== 0) return "";
    return format(parseISO(date), "MMM d");
  };

  const displayMonth = format(new Date(monthKey + "-01"), "MMMM yyyy");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Monthly Spending</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {hasData ? formatCurrency(monthTotal) + " total" : "No data"}
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
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
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
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#monthGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

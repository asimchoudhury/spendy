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
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/currency";
import { Expense } from "@/types/expense";

interface SpendingChartProps {
  expenses: Expense[];
}

const DAY_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

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

export function SpendingChart({ expenses }: SpendingChartProps) {
  const [days, setDays] = useState(30);

  const data = useMemo(() => {
    const now = new Date();
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      map[d.toISOString().split("T")[0]] = 0;
    }
    expenses.forEach((e) => {
      if (map[e.date] !== undefined) map[e.date] += e.amount;
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  }, [expenses, days]);

  const hasData = data.some((d) => d.amount > 0);

  const tickFormatter = (date: string, index: number) => {
    const step = days <= 14 ? 3 : days <= 30 ? 7 : 14;
    if (index % step !== 0) return "";
    return format(parseISO(date), "MMM d");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Daily Spending</h3>
          <p className="text-xs text-gray-500 mt-0.5">Expense totals per day</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                days === opt.value
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {!hasData ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          No spending data to display yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
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
              stroke="#7c3aed"
              strokeWidth={2}
              fill="url(#spendGrad)"
              dot={false}
              activeDot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

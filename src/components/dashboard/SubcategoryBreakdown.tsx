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

interface SubcategoryBreakdownProps {
  category: CategoryData | null;
  expenses: Expense[];
  onClose: () => void;
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function CustomTooltip({ active, payload, label }: any) {
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
}: SubcategoryBreakdownProps) {
  const now = new Date();
  const [monthKey, setMonthKey] = useState(toMonthKey(now));

  const isCurrentMonth = monthKey === toMonthKey(now);

  const goBack = () => {
    setMonthKey((m) => toMonthKey(subMonths(new Date(m + "-01"), 1)));
  };
  const goForward = () => {
    if (isCurrentMonth) return;
    setMonthKey((m) => toMonthKey(addMonths(new Date(m + "-01"), 1)));
  };

  const { monthData, allTimeData, monthTotal, allTimeTotal } = useMemo(() => {
    if (!category) return { monthData: [], allTimeData: [], monthTotal: 0, allTimeTotal: 0 };

    const catExpenses = expenses.filter((e) => e.category === category.name);
    const monthExpenses = catExpenses.filter((e) => e.date.startsWith(monthKey));

    const toBreakdown = (exps: Expense[]) => {
      const map: Record<string, number> = {};
      exps.forEach((e) => {
        const sub = e.subcategory || "General";
        map[sub] = (map[sub] || 0) + e.amount;
      });
      return Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    };

    const monthData = toBreakdown(monthExpenses);
    const allTimeData = toBreakdown(catExpenses);
    const monthTotal = monthData.reduce((s, d) => s + d.value, 0);
    const allTimeTotal = allTimeData.reduce((s, d) => s + d.value, 0);

    return { monthData, allTimeData, monthTotal, allTimeTotal };
  }, [category, expenses, monthKey]);

  const displayMonth = format(new Date(monthKey + "-01"), "MMMM yyyy");

  if (!category) return null;

  return (
    <Modal
      isOpen={!!category}
      onClose={onClose}
      title={`${category.icon} ${category.name} — Subcategory Breakdown`}
    >
      <div className="flex flex-col gap-5">
        {/* All-time summary */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <span className="text-sm text-gray-600">All-time total</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(allTimeTotal)}
          </span>
        </div>

        {/* Month picker */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Monthly View</h4>
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
          </div>

          {monthData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-xl">
              No expenses in {displayMonth}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">
                  {monthData.length} subcategor{monthData.length !== 1 ? "ies" : "y"}
                </span>
                <span className="text-xs font-semibold text-gray-700">
                  {formatCurrency(monthTotal)} total
                </span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={monthData}
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
                    {monthData.map((_, i) => (
                      <Cell key={i} fill={category.color} fillOpacity={0.8 - i * 0.1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Monthly table */}
        {monthData.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              Breakdown
            </p>
            {monthData.map((row, i) => {
              const pct = monthTotal > 0 ? (row.value / monthTotal) * 100 : 0;
              return (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{row.name}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(row.value)}
                    </span>
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

        {/* All-time table */}
        {allTimeData.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              All-time by subcategory
            </p>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">
                      Subcategory
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">
                      Total
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allTimeData.map((row, i) => {
                    const pct = allTimeTotal > 0 ? (row.value / allTimeTotal) * 100 : 0;
                    return (
                      <tr
                        key={i}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-3 py-2 text-gray-700">{row.name}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          {formatCurrency(row.value)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-400">
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

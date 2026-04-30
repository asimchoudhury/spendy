"use client";

import { formatCurrency } from "@/utils/currency";
import { CATEGORY_CONFIG } from "@/utils/categories";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Tag, Receipt } from "lucide-react";
import { Category } from "@/types/expense";

interface SummaryCardsProps {
  total: number;
  monthly: number;
  lastMonthTotal: number;
  topCategory: string | null;
  topCategoryAmount: number;
  count: number;
  monthlyCount: number;
}

export function SummaryCards({
  total,
  monthly,
  lastMonthTotal,
  topCategory,
  topCategoryAmount,
  count,
  monthlyCount,
}: SummaryCardsProps) {
  const monthDiff = monthly - lastMonthTotal;
  const monthPct =
    lastMonthTotal > 0
      ? Math.abs((monthDiff / lastMonthTotal) * 100).toFixed(0)
      : null;

  const cards = [
    {
      label: "Total Spent",
      value: formatCurrency(total),
      sub: `${count} expense${count !== 1 ? "s" : ""} total`,
      icon: DollarSign,
      gradient: "from-violet-500 to-indigo-600",
      iconBg: "bg-white/20",
    },
    {
      label: "This Month",
      value: formatCurrency(monthly),
      sub:
        monthPct !== null ? (
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
        ),
      icon: Calendar,
      gradient: "from-sky-500 to-blue-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Top Category",
      value: topCategory
        ? `${CATEGORY_CONFIG[topCategory as Category]?.icon} ${topCategory}`
        : "—",
      sub: topCategory ? formatCurrency(topCategoryAmount) + " spent" : "No data yet",
      icon: Tag,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-white/20",
    },
    {
      label: "Monthly Count",
      value: String(monthlyCount),
      sub: "transactions this month",
      icon: Receipt,
      gradient: "from-amber-500 to-orange-600",
      iconBg: "bg-white/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-5 text-white shadow-sm`}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
              {card.label}
            </p>
            <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}>
              <card.icon size={16} className="text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{card.value}</p>
          <p className="text-xs text-white/70">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

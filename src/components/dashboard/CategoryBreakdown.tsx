"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/utils/currency";
import { CATEGORY_CONFIG } from "@/utils/categories";
import { Category } from "@/types/expense";

interface CategoryBreakdownProps {
  data: { name: string; value: number }[];
  total: number;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3">
      <p className="text-xs text-gray-500 mb-1">{name}</p>
      <p className="text-sm font-semibold text-gray-900">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {payload?.map((entry: any) => {
        const cat = entry.value as Category;
        const config = CATEGORY_CONFIG[cat];
        return (
          <div key={cat} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">{config?.icon}</span>
              <span className="text-xs text-gray-600">{cat}</span>
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: entry.color }}
            >
              {formatCurrency(entry.payload.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CategoryBreakdown({ data, total }: CategoryBreakdownProps) {
  const hasData = data.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">By Category</h3>
        <p className="text-xs text-gray-500 mt-0.5">All-time breakdown</p>
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
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_CONFIG[entry.name as Category]?.color ?? "#6b7280"}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Progress bars */}
          <div className="w-full flex flex-col gap-2 mt-2">
            {data.map((entry) => {
              const config = CATEGORY_CONFIG[entry.name as Category];
              const pct = total > 0 ? (entry.value / total) * 100 : 0;
              return (
                <div key={entry.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{config?.icon}</span>
                      <span className="text-xs text-gray-700">{entry.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: config?.color ?? "#6b7280",
                      }}
                    />
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

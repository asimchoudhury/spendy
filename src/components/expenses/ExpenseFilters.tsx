"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { ExpenseFilters, CategoryData } from "@/types/expense";
import { DEFAULT_CATEGORIES } from "@/utils/categories";
import { useState } from "react";

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  categories?: CategoryData[];
  count: number;
  total: number;
}

export function ExpenseFiltersBar({
  filters,
  onChange,
  categories: categoriesProp,
  count,
}: ExpenseFiltersProps) {
  const categories =
    categoriesProp && categoriesProp.length > 0 ? categoriesProp : DEFAULT_CATEGORIES;
  const [showDateFilters, setShowDateFilters] = useState(false);

  const set = (partial: Partial<ExpenseFilters>) =>
    onChange({ ...filters, ...partial });

  const hasActiveFilters =
    filters.search ||
    filters.category !== "All" ||
    filters.dateFrom ||
    filters.dateTo;

  const clear = () =>
    onChange({ search: "", category: "All", dateFrom: "", dateTo: "" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search expenses..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white"
          />
          {filters.search && (
            <button
              onClick={() => set({ search: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowDateFilters((s) => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
            showDateFilters || filters.dateFrom || filters.dateTo
              ? "bg-violet-50 border-violet-300 text-violet-700"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Date</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["All", ...categories.map((c) => c.name)] as string[]).map((cat) => (
          <button
            key={cat}
            onClick={() => set({ category: cat })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filters.category === cat
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {showDateFilters && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">
              From
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => set({ dateFrom: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-medium whitespace-nowrap">
              To
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => set({ dateTo: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            />
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        {count} expense{count !== 1 ? "s" : ""} found
        {hasActiveFilters && (
          <span className="text-violet-600 font-medium ml-1">(filtered)</span>
        )}
      </div>
    </div>
  );
}

---
name: Spendy expense tracker project
description: Next.js 16 + Tailwind v4 expense app: stack, features, key files
type: project
---

Next.js 16.2.4, React 19, Tailwind v4, Recharts, date-fns v4, Lucide React v1.14.

**Routes:** `/` (dashboard), `/expenses`, `/breakdown` (new V2.1), `/categories`

**Key files:**
- `src/types/expense.ts` — Expense, CategoryData (with icon), Subcategory, ExpenseFilters
- `src/hooks/useExpenses.ts` — CRUD, bulk migrate/rename, stats, filteredExpenses
- `src/hooks/useCategories.ts` — addCategory/updateCategory accept icon param
- `src/utils/categories.ts` — ICON_KEYWORDS, suggestIconForCategory, DEFAULT_CATEGORIES, getCategoryConfig
- `src/utils/dateRange.ts` — TimeRange type, filterByRange, getDateRangeLabel
- `src/utils/currency.ts` — formatCurrency (en-IN, INR, Indian number system)
- `src/components/ui/IconPicker.tsx` — emoji icon grid for category forms
- `src/components/layout/Navigation.tsx` — handles both lucideIcon and emoji NavItem props

**V2.1 features implemented:**
1. Icon picker for categories (IconPicker component, auto-suggestion from ICON_KEYWORDS)
2. Enhanced summary cards (time range toggles for Total + Top Category; month picker for Monthly Count)
3. Category breakdown donut with time range toggle (CategoryBreakdown.tsx)
4. /breakdown page — Monthly View (month picker) + Period View (3m/6m/1y), grid of per-category donut charts with subcategory legend tables

**Why:** local storage only, no backend, client components everywhere.
**How to apply:** All interactive components need `"use client"`. New pages under src/app/{route}/page.tsx.

---
name: Spendy expense tracker project
description: Next.js 16 + Tailwind v4 expense app: stack, features, key files
type: project
---

Next.js 16.2.4, React 19, Tailwind v4, Recharts, date-fns v4, Lucide React v1.14.

**Routes:** `/` (dashboard), `/expenses`, `/breakdown`, `/categories`, `/export` (V3)

**Key files:**
- `src/types/expense.ts` — Expense, CategoryData (with icon), Subcategory, ExpenseFilters
- `src/hooks/useExpenses.ts` — CRUD, bulk migrate/rename, stats, filteredExpenses
- `src/hooks/useCategories.ts` — addCategory/updateCategory accept icon param
- `src/hooks/useExportHistory.ts` — ExportRecord, ExportSchedule types; history + schedules in localStorage
- `src/utils/categories.ts` — ICON_KEYWORDS, suggestIconForCategory, DEFAULT_CATEGORIES, getCategoryConfig
- `src/utils/dateRange.ts` — TimeRange type, filterByRange, getDateRangeLabel
- `src/utils/currency.ts` — formatCurrency (en-IN, INR, Indian number system)
- `src/utils/exportFormats.ts` — generateTaxReportCSV, generateMonthlySummaryCSV, generateCategoryAnalysisCSV, generateLedgerCSV, generateInsightsJSON, triggerDownload
- `src/components/ui/IconPicker.tsx` — emoji icon grid for category forms
- `src/components/layout/Navigation.tsx` — handles both lucideIcon and emoji NavItem props
- `src/components/export/CloudExportHub.tsx` — V3 export hub, 5-tab dark-theme cloud UI

**V2.1 features implemented:**
1. Icon picker for categories (IconPicker component, auto-suggestion from ICON_KEYWORDS)
2. Enhanced summary cards (time range toggles for Total + Top Category; month picker for Monthly Count)
3. Category breakdown donut with time range toggle (CategoryBreakdown.tsx)
4. /breakdown page — Monthly View (month picker) + Period View (3m/6m/1y), grid of per-category donut charts with subcategory legend tables

**V3 Export Hub (exportfeature-v3 branch):**
Full dark-theme cloud-integrated export system at `/export`:
- Templates tab: 6 pre-built export templates (Tax Report, Monthly Summary, Category Analysis, Expense Ledger, Insights JSON, Full Export) each with different generators
- Destinations tab: 5 cloud service integrations (Google Sheets, Dropbox, OneDrive, Notion, Email) with simulated OAuth connect/disconnect + animated upload
- Auto-Backup tab: Schedule builder (daily/weekly/monthly) with day/time picker; active schedules list with toggle/delete
- History tab: Tracks all exports with timestamp, format, destination, file size, row count; "download again" support
- Share tab: Generates shareable UUID links with expiry options + SVG QR code (deterministic pseudo-random with real finder patterns)

**Why:** local storage only, no backend, client components everywhere.
**How to apply:** All interactive components need `"use client"`. New pages under src/app/{route}/page.tsx.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server on http://localhost:3000
npm run build    # production build (runs type-check + lint)
npm run lint     # ESLint only
```

There are no tests. The only runtime validation is TypeScript (`tsc --noEmit` runs as part of `build`).

## Stack versions — read the docs before writing code

| Package | Version | Why it matters |
|---|---|---|
| Next.js | **16.2.4** | Newer than training data; see `node_modules/next/dist/docs/` |
| React | **19.2.4** | New compiler, changed hook semantics |
| Tailwind CSS | **v4** | Config-less; no `tailwind.config.js`; utilities differ from v3 |
| date-fns | **v4** | Breaking API changes from v3 |
| lucide-react | **v1.14** | Icon names and import paths changed from earlier versions |
| recharts | **3.x** | New chart API |

## Architecture

**No backend, no database.** Everything persists in `localStorage` under three keys: `expenses`, `expense-filters`, `categories`. Storage is capped at ~5 MB; the app surfaces `QuotaExceededError` gracefully.

### Data flow

```
localStorage
  └─ useLocalStorage<T>(key, default)    // src/hooks/useLocalStorage.ts
       ├─ useExpenses()                  // src/hooks/useExpenses.ts
       │    └─ expenses page, dashboard page
       └─ useCategories()               // src/hooks/useCategories.ts
            └─ categories page, expenses page
```

`useLocalStorage` returns `[value, setter, isLoaded]`. The setter always returns `{ quotaExceeded: boolean }` — callers must check this and show `<StorageFullModal>` when true. Never throw on quota errors.

### Pages (App Router)

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Dashboard: summary cards, charts, recent expenses, quick-add |
| `/expenses` | `src/app/expenses/page.tsx` | Full CRUD list with filters, import, export |
| `/breakdown` | `src/app/breakdown/page.tsx` | Monthly + period donut charts per category |
| `/categories` | `src/app/categories/page.tsx` | Manage categories and subcategories |

Root layout (`src/app/layout.tsx`) wraps all pages with `<Navigation>` and a `max-w-6xl` centred container.

### Key invariants

- **Every interactive component needs `"use client"`** at the top — there is no server state.
- New pages go in `src/app/{route}/page.tsx`.
- `useLocalStorage` initialises asynchronously (SSR returns `initialValue`); always gate renders on `isLoaded` before showing real data.
- Expense IDs are `${Date.now()}-${Math.random().toString(36).slice(2, 9)}` — sufficient for client-only use.
- Currency is always INR (`formatCurrency` uses `en-IN` locale with the Indian number system).

### Category system

Categories are stored as `CategoryData[]` with embedded `subcategories[]`. `DEFAULT_CATEGORIES` (six built-ins) are seeded into localStorage on first load by `useCategories`. When a category or subcategory is renamed/deleted, `useExpenses` exposes `bulkRenameCategory`, `bulkMigrateCategory`, etc. to keep existing expenses consistent.

`suggestIconForCategory(name)` in `src/utils/categories.ts` returns an emoji from `ICON_KEYWORDS` based on keywords in the category name, falling back to `📁`.

### Export formats

`src/utils/exportFormats.ts` exports three functions — `exportCSV`, `exportJSON`, `exportPDF`. The PDF export builds an HTML string and opens it in a new window for `window.print()` (no server-side PDF rendering).

### Responsive layout

Nav is a sticky top bar with inline links on `sm+` and a hamburger menu on mobile. Page-level buttons use `hidden sm:inline` / `sm:hidden` to swap between icon-only (mobile) and labelled (desktop) variants. Edit/delete action buttons on expense cards are `opacity-0 group-hover:opacity-100` on desktop but always visible on mobile.

### Docs

Generated documentation lives in `docs/`:
- `docs/dev/` — developer implementation guides (`.md`)
- `docs/user/` — user guides (`.md` + `.docx` with screenshots)

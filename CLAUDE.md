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

**Database: Supabase (PostgreSQL).** The Supabase JS client talks directly to Supabase from the browser — no custom API routes. Auth is Supabase Auth (email/password). Row Level Security (RLS) ensures each user can only access their own rows.

`expense-filters` is the only thing still in `localStorage` — it is ephemeral UI state that is harmless to lose.

### Data flow

```
Supabase (PostgreSQL)
  ├─ useExpenses()       // src/hooks/useExpenses.ts
  │    └─ expenses page, dashboard page
  └─ useCategories()     // src/hooks/useCategories.ts
       └─ categories page, expenses page

localStorage
  └─ useLocalStorage<ExpenseFilters>("expense-filters", ...)
       └─ useExpenses() — filters only
```

Both hooks gate renders on `isLoaded` (set after the initial Supabase fetch completes). All mutations are optimistic: local state updates immediately, Supabase write follows in the background. Errors surface via `error: string | null` in the hook's return value.

Auth is provided by `AuthProvider` (context) and enforced by `RouteGuard`. All pages except `/login` and `/signup` require a session.

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
- `useExpenses` and `useCategories` initialise asynchronously (Supabase fetch); always gate renders on `isLoaded` before showing real data.
- Expense IDs are `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`.
- Currency is always INR (`formatCurrency` uses `en-IN` locale with the Indian number system).

### Category system

Categories are stored as `CategoryData[]` with embedded `subcategories[]`. `DEFAULT_CATEGORIES` (six built-ins) are seeded into the Supabase `categories` table the first time a new user's account is empty. When a category or subcategory is renamed/deleted, `useExpenses` exposes `bulkRenameCategory`, `bulkMigrateCategory`, etc. to keep existing expenses consistent.

`suggestIconForCategory(name)` in `src/utils/categories.ts` returns an emoji from `ICON_KEYWORDS` based on keywords in the category name, falling back to `📁`.

### Export formats

`src/utils/exportFormats.ts` exports three functions — `exportCSV`, `exportJSON`, `exportPDF`. The PDF export builds an HTML string and opens it in a new window for `window.print()` (no server-side PDF rendering).

### Responsive layout

Nav is a sticky top bar with inline links on `sm+` and a hamburger menu on mobile. Page-level buttons use `hidden sm:inline` / `sm:hidden` to swap between icon-only (mobile) and labelled (desktop) variants. Edit/delete action buttons on expense cards are `opacity-0 group-hover:opacity-100` on desktop but always visible on mobile.

### Docs

Generated documentation lives in `docs/`:
- `docs/dev/` — developer implementation guides (`.md`)
- `docs/user/` — user guides (`.md` + `.docx` with screenshots)

# Implementation Plan: Database Migration & User Authentication

## Agent rules for this plan

These rules apply only while this plan is active. Remove `@PLAN.md` from `CLAUDE.md`
once Phase 6 is complete.

1. **Read this file at the start of every session.** Note the Current Phase and work
   only within that phase's scope.

2. **One phase at a time.** Never implement work belonging to a future phase, even if
   it seems convenient. If the current phase depends on something in a future phase,
   stop and flag it.

3. **Stay on the feature branch.** All work happens on `feature/database-auth-migration`.
   Never commit to or modify `main`.

4. **Respect file ownership.** Only modify files listed under the current phase in the
   File Ownership table below. Leave all other files untouched.

5. **Update the Current Phase line** in this file before committing at the end of
   each phase.

6. **Commit at the end of each phase** using the commit message specified in that
   phase's section.

---

## Goal

Migrate the expense tracker from `localStorage` to Supabase (PostgreSQL) and add user
authentication, so each user has their own private, persistent expense data accessible
from any device or browser.

---

## Git Branch

All work in this plan happens on the `feature/database-auth-migration` branch.
The `main` branch must remain untouched and fully working at all times.

```bash
# Create and switch to the feature branch before writing any code
git checkout -b feature/database-auth-migration
```

<!-- Merge into `main` only after Phase 6 is complete and fully tested. -->

---

## Architecture Decisions

- **Database**: Supabase (PostgreSQL). Client-side queries via `@supabase/supabase-js`.
  No custom API routes — the Supabase JS client talks directly to Supabase from the browser.
- **Auth**: Supabase Auth. Support email/password and Google OAuth.
- **Row Level Security (RLS)**: Enabled on all tables. Users can only read/write their own rows.
- **Category/subcategory references on expenses**: Kept as denormalised name strings — not
  foreign keys. The existing `bulkRenameCategory` / `bulkMigrateCategory` logic stays intact.
- **Tailwind strings on CategoryData**: `bgColor` and `textColor` are stored as-is in Supabase
  (plain text columns). Clean-up is a future concern, out of scope here.
- **`expense-filters`**: Stays in `localStorage` permanently. It is ephemeral UI state — losing
  it on a browser clear is harmless. Do not migrate it to Supabase.
- **Category IDs**: Kept as-is. Built-in slugs (`"food"`, `"food-general"`) and user-created
  `Date.now()`-based IDs both co-exist as plain text primary keys.
- **No SSR of user data**: All data-fetching hooks remain `"use client"`. Gate renders on
  session ready state as before.
- **Default categories**: Seed `DEFAULT_CATEGORIES` for a new user automatically on their
  first login (when their categories table is empty). This is not sample data — these are
  the baseline categories every user needs. Sample expense data loads only when the user
  explicitly clicks "Load Sample Data".

---

## Agreed Database Schema

### `expenses` table

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | Primary key. Existing `${Date.now()}-${random}` format. |
| `user_id` | `uuid` | Foreign key → `auth.users.id`. NOT NULL. |
| `amount` | `numeric(12,2)` | INR. Always positive. |
| `category` | `text` | Denormalised category name string. |
| `subcategory` | `text` | Denormalised subcategory name string. Nullable. |
| `description` | `text` | Nullable. |
| `date` | `date` | The expense date (YYYY-MM-DD). |
| `created_at` | `timestamptz` | Maps to `createdAt`. Default `now()`. |
| `updated_at` | `timestamptz` | Maps to `updatedAt`. Default `now()`. |

### `categories` table

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | Primary key. Slug or `Date.now()`-based string. |
| `user_id` | `uuid` | Foreign key → `auth.users.id`. NOT NULL. |
| `name` | `text` | NOT NULL. |
| `color` | `text` | Hex string e.g. `"#f97316"`. |
| `bg_color` | `text` | Tailwind class e.g. `"bg-orange-100"`. |
| `text_color` | `text` | Tailwind class e.g. `"text-orange-700"`. |
| `icon` | `text` | Emoji string. |
| `subcategories` | `jsonb` | Array of `{ id: string, name: string }`. Default `'[]'`. |
| `created_at` | `timestamptz` | Default `now()`. |

### RLS Policies

Run this SQL in the Supabase dashboard SQL editor:

```sql
-- Enable RLS on both tables
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Users can only access their own rows
CREATE POLICY "own rows only" ON expenses
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own rows only" ON categories
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## TypeScript Interfaces (current — do not change)

```ts
interface Subcategory {
  id: string;
  name: string;
}

interface CategoryData {
  id: string;
  name: string;
  color: string;       // hex
  bgColor: string;     // Tailwind class
  textColor: string;   // Tailwind class
  icon: string;        // emoji
  subcategories: Subcategory[];
}

interface Expense {
  id: string;
  date: string;        // "YYYY-MM-DD"
  amount: number;
  category: string;    // denormalised name
  subcategory: string; // denormalised name
  description: string;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

interface ExpenseFilters {
  search: string;
  category: string;    // "All" or a category name — never null
  dateFrom: string;    // "YYYY-MM-DD" or ""
  dateTo: string;      // "YYYY-MM-DD" or ""
}
```

---

## Environment Variables

Create `.env.local` in the project root if not present already (must be in `.gitignore` — never commit it):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Also add both variables in Vercel → Settings → Environment Variables before deploying.

---

## Supabase Client

File to create: `src/lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Import `supabase` from this file everywhere. Never create multiple client instances.

---

## Implementation Phases

### Phase 1 — Supabase project setup

**Goal**: Tables exist in Supabase, RLS is enabled, the client connects from the app.

Tasks:
1. Confirm you are on branch `feature/database-auth-migration`
2. `npm install @supabase/supabase-js`
3. Create `src/lib/supabase.ts`
4. Create `.env.local` with project URL and anon key
5. Run the schema + RLS SQL above in the Supabase dashboard SQL editor
6. Smoke-test: temporarily log `supabase` in any page to confirm no import errors. Remove after.

**Do not touch any existing hooks or pages in this phase.**

Commit: `feat: supabase client setup and schema`

---

### Phase 2 — User authentication

**Goal**: Users can sign up, log in, and log out. All pages redirect to login when unauthenticated.

Tasks:
1. Create `src/components/AuthProvider.tsx` — context exposing `user`, `session`,
   `signIn`, `signUp`, `signOut`, `isLoading`
2. Wrap `src/app/layout.tsx` with `<AuthProvider>`
3. Create `src/app/login/page.tsx` — email/password form + Google OAuth button
4. Create `src/app/signup/page.tsx` — sign-up form
5. Add route guard in `layout.tsx` (or `middleware.ts`): redirect to `/login` if no session.
   Applies to all pages: `/`, `/expenses`, `/breakdown`, `/categories`
6. Add sign-out button + user email display to `<Navigation>`
7. Auth errors (wrong password, email taken) must be shown inline in the form — not as
   alerts or console logs

**Do not touch `useExpenses` or `useCategories` in this phase.**

Commit: `feat: user authentication with Supabase Auth`

---

### Phase 3 — Migrate `useCategories` to Supabase

**Goal**: Categories are read from and written to Supabase, scoped to the logged-in user.

Tasks:
1. Rewrite `src/hooks/useCategories.ts`:
   - Replace `useLocalStorage` reads/writes with Supabase `select` / `insert` /
     `update` / `delete` on the `categories` table
   - Always filter by `user_id` — use `supabase.auth.getUser()`, never hardcode a UUID
   - On first load for a new user (empty result), bulk-insert `DEFAULT_CATEGORIES`
     with the user's `user_id`
   - Keep the identical return shape so no consuming pages need changes
2. Test: create, rename, delete a category. Verify correct rows and `user_id` in the
   Supabase dashboard.

**Do not migrate `useExpenses` yet.**

Commit: `feat: migrate useCategories to Supabase`

---

### Phase 4 — Migrate `useExpenses` to Supabase

**Goal**: Expenses are read from and written to Supabase, scoped to the logged-in user.

Tasks:
1. Rewrite `src/hooks/useExpenses.ts`:
   - Replace `useLocalStorage` reads/writes with Supabase queries on the `expenses` table
   - Keep all existing functions with identical signatures: `addExpense`, `updateExpense`,
     `deleteExpense`, `bulkRenameCategory`, `bulkMigrateCategory`, etc.
   - Always include `.eq('user_id', user.id)` in every query
   - Map DB column names (`created_at`, `updated_at`) to interface fields
     (`createdAt`, `updatedAt`) consistently
2. Test: add, edit, delete expenses. Test bulk rename by renaming a category and
   confirming all associated expenses update. Verify `user_id` scoping in Supabase.

Commit: `feat: migrate useExpenses to Supabase`

---

### Phase 5 — One-time data migration (localStorage → Supabase)

**Goal**: Existing users with data in `localStorage` can migrate it to their Supabase
account without losing anything.

Tasks:
1. After a user logs in for the first time, check `localStorage` for existing expenses
   and categories
2. Detect "first login" via a `has_migrated` flag stored in `localStorage`
3. If data exists and `has_migrated` is not set, show a one-time modal:
   *"We found X expenses saved in this browser. Import them to your account?"*
   with Import and Skip buttons
4. On Import: bulk-insert expenses and categories into Supabase with the user's
   `user_id`, then clear the relevant `localStorage` keys and set `has_migrated = true`
5. On Skip: set `has_migrated = true`, leave `localStorage` data untouched
6. `expense-filters` is never migrated — it stays in `localStorage` as always

Commit: `feat: one-time localStorage to Supabase migration`

---

### Phase 6 — Testing and cleanup

**Goal**: App is stable, no `localStorage` dependency for core data, ready to review.

Tasks:
1. Full user journey test: sign up → migration prompt → add/edit/delete expenses →
   categories → breakdown page → sign out → sign back in → data persists
2. Multi-user isolation test: open a second browser / incognito window, sign in as a
   different user, confirm data is completely separate
3. Remove all temporary `console.log` statements
4. Confirm `.env.local` is in `.gitignore`
5. Push `feature/database-auth-migration` to GitHub
6. Confirm Vercel preview deployment succeeds with env variables set
7. Smoke-test the Vercel preview URL

Commit: `chore: cleanup and prepare for review`

---

## Current Phase

**Phase 6 — Testing and cleanup**

Update this line at the start of each new phase.

---

## File Ownership by Phase

| File | Phase | Action |
|---|---|---|
| `src/lib/supabase.ts` | 1 | Create |
| `.env.local` | 1 | Create |
| `src/components/AuthProvider.tsx` | 2 | Create |
| `src/app/login/page.tsx` | 2 | Create |
| `src/app/signup/page.tsx` | 2 | Create |
| `src/app/layout.tsx` | 2 | Modify (add AuthProvider + route guard) |
| `src/components/Navigation.tsx` | 2 | Modify (add sign-out + user display) |
| `src/hooks/useCategories.ts` | 3 | Rewrite |
| `src/hooks/useExpenses.ts` | 4 | Rewrite |
| `src/hooks/useLocalStorage.ts` | 5 | No change (still used for filters) |

---

## What Must Never Change

- `formatCurrency` — INR and `en-IN` locale are fixed
- Expense ID format — keep `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
- `DEFAULT_CATEGORIES` definition — only the seeding mechanism changes
- `exportCSV`, `exportJSON`, `exportPDF` in `src/utils/exportFormats.ts` — out of scope
- All UI components, Tailwind classes, and visual design unrelated to auth

---

## Error Handling Conventions

- Supabase queries return `{ data, error }`. Always check `error` before using `data`.
- Never throw inside hooks — surface errors via returned state (e.g. `error: string | null`).
- Auth errors must be shown inline in the login/signup form.
- `StorageFullModal` and quota error handling can be removed from hooks once
  `useLocalStorage` is no longer used for expenses and categories (end of Phase 5).

## WHEN YOU ARE DONE WITH EACH PHASE

### Step 1 — Lint
```bash
npm run lint
```
Fix all ESLint errors and warnings before proceeding.

### Step 2 — TypeScript check
```bash
npx tsc --noEmit
```
There must be zero TypeScript errors. Fix every one before proceeding.

### Step 3 — Build verification
```bash
npm run build
```
The build must complete with no errors. Fix all build errors before proceeding.
A successful build output should show all routes compiled cleanly.

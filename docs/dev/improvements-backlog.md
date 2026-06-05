# Improvements Backlog

Synthesis of a back-end + front-end analysis pass (2026-06-04). We pick these up one
by one as time permits and tick them off here. Each item: location → why it matters.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Back-end (Supabase data layer)

### High — silent data loss / divergence
- [x] **B1. Roll back optimistic mutations on real server errors** — new `commitWrite` helper (`offlineQueue.ts`) routes a write outcome to `onNetworkError` (enqueue) vs `onServerError` (rollback + surface). `addExpense`/`updateExpense`/`deleteExpense`/`smartImportExpenses` and `useCategories.importCategories` now revert the optimistic change on a genuine server rejection so local state can't diverge from the DB. (Imports roll back on any failure — there's no bulk offline queue.)
- [x] **B2. Enqueue (or surface) when the fetch *throws*, not just on resolved `error`** — `commitWrite` `await`s the write inside try/catch, so a rejected promise (`TypeError: Failed to fetch`) is caught and routed through the same `isNetworkError → enqueue` path instead of going unhandled. Verified via Playwright: a forced throw keeps the optimistic row and lands a correctly-shaped `add` entry in the durable queue. **Bonus fix found while testing:** Supabase errors are plain objects, not `Error` instances, so error messages now go through `errorMessage()` instead of `String(err)` (was rendering "[object Object]").
- [ ] **B3. Make category rename/migrate atomic** — `bulkRenameCategory`/`bulkMigrateCategory` (`useExpenses.ts`) + `useCategories.updateCategory`. Two un-transacted writes; a mid-flow failure orphans every expense from its renamed category (joined by name string). Add a `rename_category_cascade`/`migrate_category_cascade` RPC mirroring `0001_delete_category_cascade.sql`, or roll back local state on failure.
- [ ] **B4. Make Replace-All / seed non-destructive** — `replaceAllExpenses` (`useExpenses.ts:234`), `seedSampleData` (`:90`). Delete-then-insert is non-atomic; if the insert fails the entire history is gone server-side with no backup. Insert/stage first, delete the old set only after insert confirms — ideally one server-side RPC.
- [x] **B5. Validate amount before writes** — `useExpenses.ts`. `addExpense`/`updateExpense` now parse the amount once and bail with `setError` if it isn't a finite, positive number, so a bad value never reaches local state or Supabase. `addExpense` returns `Expense | null`.

### Medium
- [ ] **B6. Bound the initial fetch** — `useExpenses.ts:60`, `useCategories.ts:83` use `select("*")` for all rows; unbounded growth, full re-pull on every `triggerRefetch`. Add date-window/pagination or push aggregates to a Postgres view/RPC.
- [ ] **B7. Don't reset dedup refs in effect cleanup** — `useExpenses.ts:83`, `useCategories.ts:166`. Cleanup nulls `loadedForUser`/`loadedForRefetchKey`, defeating the guard and forcing a double-fetch in Strict Mode. Rely on the `cancelled` flag + value check instead.
- [ ] **B8. Classify errors by code, not message regex** — `offlineQueue.ts:78`. `isNetworkError` misclassifies CORS/auth/500s as network → silently enqueued, retried, then dropped after MAX_RETRIES (effectively swallowed). Prefer PostgREST `code` / HTTP status.
- [ ] **B9. Coalesce per-`expenseId` queue entries** — `offlineQueue.ts:112` + `OfflineSyncManager.drain`. Independent replay of add/update/delete for the same id can resurrect deletes or no-op updates on dropped adds. Collapse add+delete → no-op, last-write-wins, before draining.

### Low
- [ ] **B10. Escape export output** — `exportFormats.ts:79` (`exportPDF` interpolates raw HTML → self-XSS) and CSV (`exportCSV`/`csv.ts`) lacks formula-injection guard. HTML-escape values; prefix risky CSV cells with `'`.
- [ ] **B11. Version-control RLS policies** — `src/lib/supabase.ts`. Client `.eq("user_id")` filters are cosmetic; RLS is the only real protection but lives only in the dashboard. Export the `expenses`/`categories` policies into `supabase/migrations/`.
- [ ] **B12. Surface email-confirmation state from `signUp`** — `AuthProvider.tsx:48`. Returns only `{ error }`; caller can't tell "check your email" from "logged in". Return `data.session`/confirmation status.
- [ ] **B13. Consolidate the two diverging CSV exporters** — `exportFormats.ts` `exportCSV` (`12.50`) vs `csv.ts` `exportToCSV` (`₹12.50`). The second can't round-trip through import. Pick one; keep exported amounts machine-parseable.

---

## Front-end (pages, components, charts)

### High
- [x] **F1. Add focus trap + dialog ARIA to Modal** — `src/components/ui/Modal.tsx` now sets `role="dialog"`/`aria-modal`/`aria-labelledby` (title id via `useId`), moves focus into the dialog on open, traps Tab/Shift+Tab, and restores focus to the trigger on close. Modal honors a `[data-autofocus]` child as its initial focus target (falls back to first focusable); marked the `ExpenseForm` amount input so Add Expense lands the cursor there. Also auto-focus the email field on the login page. Verified live (login autofocus + Add Expense modal: ARIA, focus-in, Tab/Shift+Tab trap, Escape-restore, amount autofocus) against a production build. Squashed + merged to main as `96ebd72`. (Escape + scroll-lock were already present.)
- [x] **F2. Surface hook errors on Dashboard & Breakdown** — extracted a shared `src/components/ui/ErrorBanner.tsx` (suppresses network errors, which the global offline banner already covers) and wired it into `page.tsx` and `breakdown/page.tsx`, both now reading `error` from `useExpenses`/`useCategories`. Categories page left on its inline version to stay in scope.
- [x] **F3. Accessible names for icon-only controls** — added `aria-label` to the Modal close button ("Close dialog"), ExpenseItem edit/delete ("Edit expense"/"Delete expense", kept `title` for hover), Toast dismiss ("Dismiss notification"), and ExpenseFilters search-clear/clear-filters/date-toggle. Marked decorative lucide icons `aria-hidden="true"` (lucide v1.14 already defaults to this for childless icons; made it explicit). Verified live: all 7 buttons resolve to correct accessible names in the accessibility tree, decorative SVGs are aria-hidden.

### Medium
- [ ] **F4. Non-visual equivalent for charts** — `CategoryBreakdown`, `MonthlyDonutChart`, breakdown `DonutCard`. Mark chart SVGs `aria-hidden`; ensure an adjacent text table (most already exist).
- [ ] **F5. Memoize toast handlers + add live region** — `ui/Toast.tsx:64`. Unstable `addToast`/`dismiss` reset the 3.5s auto-dismiss timer on parent re-render; container lacks `aria-live`. `useCallback` + `aria-live="polite"` (`role="alert"` for errors).
- [ ] **F6. Make category picker / filter chips a labelled radio group** — `ExpenseForm.tsx:175`, `ExpenseFilters.tsx:87`. Selection conveyed only by styling. Add `role="radiogroup"` + `aria-checked`/`aria-pressed`.
- [ ] **F7. Associate form inputs with labels** — `ExpenseForm.tsx` `fieldWrapper:120`, ExpenseFilters dates, categories `NameInput`. Thread `id`/`htmlFor`, add `aria-invalid`/`aria-describedby`. (login/page.tsx does this right — match it.)
- [ ] **F8. De-duplicate chart boilerplate** — `CustomTooltip`/`DonutTooltip`, empty-state block, and the month-navigator are re-implemented across SpendingChart/CategoryBreakdown/SubcategoryBreakdown/MonthlyDonutChart/breakdown page (~150 lines). Extract `ChartTooltip`, `ChartCard`, `MonthNavigator`.
- [ ] **F9. Remove dead code** — unused `handleExportJSON` (`page.tsx:39`, `expenses/page.tsx:64`) and unused `useRouter`/`router` (`page.tsx:4,26`). Lint runs in build.

### Low
- [ ] **F10. Honor `prefers-reduced-motion`** — `globals.css`. Disable `animate-in`/`zoom-in`/`slide-in`/transitions under a reduce media query.
- [ ] **F11. Use `formatCurrency` for chart Y-axis ticks** — `SpendingChart.tsx:116`, `SubcategoryBreakdown.tsx:161` use `₹${v}` (no Indian grouping). Call `formatCurrency` (do not modify it — rule #4).
- [ ] **F12. Stable keys instead of array index** — `SubcategoryBreakdown.tsx:165,182`. Data is sorted by value (reorders); use `row.name`.
- [ ] **F13. Verify React 19 compiler is enabled** — `next.config`. No `React.memo` anywhere; if the compiler is off, charts re-render on every dashboard state change. Confirm config.

---

## Suggested order

1. **F2 + B5** — quick, directly enforce stated rules (error-surfacing, no NaN).
2. **B1 + B2** — highest-risk back-end (silent data loss / divergence).
3. **F1** — biggest a11y gap, touches every flow.
4. **B3 + B4** — atomicity for rename/migrate and Replace-All.
5. Remaining mediums, then lows, as time permits.

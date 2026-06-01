# Spendy — Improvement Tasks

This file is the single source of truth for all planned changes.
Work through it **phase by phase**. Complete and verify each phase before starting the next.

---

## Git Strategy

### Setup (do this once, before touching any code)

```bash
git checkout main
git pull origin main
git checkout -b feature/spendy-improvements
```

All work happens on `feature/spendy-improvements`. Never commit directly to `main` during
this work.

### After each phase

```bash
git add -A
git commit -m "Phase X: <short description>"
```

### Merging to main

> **Why Pull Requests?** Your app is deployed on Vercel. Merging to `main` triggers an
> automatic deployment. A Pull Request (PR) gives you a visual diff on GitHub to review
> every change one last time before it goes live — even when working solo. It also keeps
> a permanent record of what was merged and when.

You have two options — choose one before you start:

---

**Option A — Merge all at once (recommended for beginners)**

After all three phases are verified locally:

```bash
# Push your feature branch to GitHub
git push origin feature/spendy-improvements
```

Then on GitHub:
1. Open your repository — GitHub will show a banner:
   *"feature/spendy-improvements had recent pushes"*
2. Click **"Compare & pull request"**
3. Set **base: main** ← **compare: feature/spendy-improvements**
4. Title: `feat: all Spendy improvements (Phases 1–3)`
5. Review the diff, then click **"Merge pull request"** → **"Confirm merge"**

Then sync your local machine:
```bash
git checkout main
git pull origin main
```

---

**Option B — Merge phase by phase**

After each phase is verified locally, push and open a PR for that phase:

```bash
# Push the latest commits on your feature branch
git push origin feature/spendy-improvements
```

Then on GitHub:
1. Open your repository
2. Click **"Compare & pull request"** (or go to Pull Requests → New pull request)
3. Set **base: main** ← **compare: feature/spendy-improvements**
4. Title: `Phase X: <short description>` (e.g. `Phase 1: UI fixes`)
5. Review the diff, then click **"Merge pull request"** → **"Confirm merge"**

Then sync locally and continue on the feature branch for the next phase:
```bash
git checkout main
git pull origin main
git checkout feature/spendy-improvements
git rebase main        # keeps your feature branch up to date with what just merged
```

Repeat for each phase.

### Rolling back a phase
If a phase breaks something, revert just that commit:
```bash
git log --oneline          # find the bad commit hash
git revert <hash>          # creates a new undo commit, safe for shared branches
```

---

## Phase 1 — Safe UI Fixes (no logic changes)

**Files touched:** `SummaryCards.tsx`, `Navigation.tsx`, `MonthlyDonutChart.tsx`, `src/app/login/page.tsx`

**Risk:** Low. These are visual-only changes. Easy to verify in the browser immediately.

---

### Task 1.1 — Rename "Category Breakdown" → "Monthly Breakdown"

**File:** `src/components/dashboard/MonthlyDonutChart.tsx`

In the JSX, find the `<h3>` element that reads `Category Breakdown` and change its text
content to `Monthly Breakdown`. No other changes to this file.

---

### Task 1.2 — Replace DollarSign icon with IndianRupee in SummaryCards

**File:** `src/components/dashboard/SummaryCards.tsx`

1. In the import line at the top, remove `DollarSign` from the lucide-react imports and
   add `IndianRupee` in its place.
2. In Card 1 (Total Spent), find `<DollarSign size={16} className="text-white" />` and
   replace it with `<IndianRupee size={16} className="text-white" />`.
3. Do not change the Receipt icon in Card 4 — that is correct and stays as-is.
4. Do not change any other part of this file.

---

### Task 1.3 — Replace DollarSign icon with IndianRupee in Navigation (Expenses link)

**File:** `src/components/Navigation.tsx`

Currently the "Expenses" nav item uses the `Receipt` lucide icon — check the `navItems`
array. If it already uses `Receipt`, no change is needed here. Only make a change if
there is a `DollarSign` icon being used for the Expenses nav item; replace it with
`IndianRupee`. Do not change any other nav item or any other part of this file.

> Note for implementor: Review the file carefully before editing. The navItems array
> currently shows Receipt for Expenses — confirm before touching anything.

---

### Task 1.4 — Move "Forgot password?" link below the password input field

**File:** `src/app/login/page.tsx`

**Current structure (simplified):**
```
<div>
  <div className="flex items-center justify-between mb-1">
    <label htmlFor="password">Password</label>
    <Link href="/forgot-password">Forgot password?</Link>   ← REMOVE from here
  </div>
  <input id="password" type="password" ... />
</div>
```

**Target structure:**
```
<div>
  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
    Password
  </label>
  <input id="password" type="password" ... />
  <div className="flex justify-end mt-1.5">
    <Link href="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700">
      Forgot password?
    </Link>
  </div>
</div>
```

Specific steps:
1. Change the password label wrapper from `<div className="flex items-center justify-between mb-1">` 
   back to a plain `<label>` with `className="block text-sm font-medium text-gray-700 mb-1"`.
2. Remove the `<Link>` for "Forgot password?" from inside the label wrapper entirely.
3. After the `<input id="password" .../>` closing tag, add:
   ```jsx
   <div className="flex justify-end mt-1.5">
     <Link href="/forgot-password" className="text-xs text-violet-600 hover:text-violet-700">
       Forgot password?
     </Link>
   </div>
   ```
4. The tab order (email → password → sign in button) must be preserved. Do not add
   `tabIndex` to the Link — it will naturally fall after the password input in DOM order,
   which is correct for keyboard UX.
5. Do not change any other part of this file.

---

### Task 1.5 — Mobile summary card fluid font sizing

**File:** `src/components/dashboard/SummaryCards.tsx`

**Problem:** On mobile (2-column grid), currency values overflow their card when they
reach 7+ digits (e.g. ₹10,00,000.00). The fix uses responsive font sizing — no
truncation, no abbreviation, no tooltips, no layout changes.

**Changes — exactly four `<p>` elements:**

1. **Card 1 — Total Spent** (renders `{formatCurrency(filteredTotal)}`):
   Change `className="text-2xl font-bold text-white mb-0"` to
   `className="text-lg sm:text-2xl font-bold text-white mb-0 tabular-nums"`

2. **Card 2 — This Month** (renders `{formatCurrency(monthly)}`):
   Change `className="text-2xl font-bold text-white mb-1"` to
   `className="text-lg sm:text-2xl font-bold text-white mb-1 tabular-nums"`

3. **Card 3 — Top Category** (renders the category name/icon string):
   Change `className="text-2xl font-bold text-white mb-0 truncate"` to
   `className="text-lg sm:text-2xl font-bold text-white mb-0 truncate"`
   (`truncate` already handles overflow for text; no `tabular-nums` needed here)

4. **Card 4 — Monthly Count** (renders `{selectedMonthCount}`):
   Change `className="text-2xl font-bold text-white mb-0"` to
   `className="text-lg sm:text-2xl font-bold text-white mb-0 tabular-nums"`

**Also add** `min-w-0` to the outermost `<div>` of Card 1 and Card 2 (the gradient
wrapper divs) so flex/grid does not force them past their column boundary. Add it
alongside their existing classes — e.g. append `min-w-0` to the className string.

**Do not change:**
- `formatCurrency` or any currency/locale logic
- Card layout, padding, gradients, or colours
- The `TimeRangeToggle` component or month navigator
- Any other component or file

---

### Phase 1 — Verification checklist

Before committing, open the app in the browser and confirm:

- [ ] `MonthlyDonutChart` heading now reads "Monthly Breakdown"
- [ ] Card 1 (Total Spent) shows the ₹ Rupee icon, not $
- [ ] Navigation "Expenses" link shows the correct icon (no $ sign anywhere in nav)
- [ ] Login page: "Forgot password?" appears **below** the password input field, right-aligned
- [ ] Tab key on login: email → password → Sign in button (link is skipped in tab order naturally)
- [ ] On mobile viewport (375px): ₹10,00,000.00 fits in Card 1 and Card 2 without overflow
- [ ] On desktop: all four cards look identical to before (text-2xl restored via sm: breakpoint)

```bash
git add -A
git commit -m "Phase 1: UI fixes — rupee icon, monthly breakdown title, forgot password placement, mobile card font"
```

---

## Phase 2 — Dashboard Chart Interactions

**Files touched:** `SubcategoryBreakdown.tsx`, `MonthlyDonutChart.tsx`

**Risk:** Medium. These changes are self-contained inside modal/chart components.
They do not touch Supabase or any hook. Easy to test by clicking chart segments.

---

### Task 2.1 — All-time breakdown with period selector in SubcategoryBreakdown modal

**File:** `src/components/dashboard/SubcategoryBreakdown.tsx`

**Current behaviour:** The modal opens showing an "All-time summary" total at the top,
then a "Monthly View" section with a month navigator and bar chart, then a monthly
breakdown table, then an all-time breakdown table at the bottom.

**Target behaviour:** The modal defaults to showing the "All-time" breakdown as the
primary view with a period selector (All time / 1 Year / 6 Months / 3 Months). The
monthly navigator section is removed. The bar chart and breakdown table update based
on the selected period.

**Detailed implementation:**

1. Import `filterByRange`, `TIME_RANGE_OPTIONS`, and `TimeRange` from
   `@/utils/dateRange` (the same import already used in `CategoryBreakdown.tsx`).

2. Remove the `monthKey` state and all month navigation state/logic (`isCurrentMonth`,
   `goBack`, `goForward`, `displayMonth`).

3. Add a new state: `const [range, setRange] = useState<TimeRange>("all");`

4. Rewrite the `useMemo` to derive `chartData` and `chartTotal` from
   `filterByRange(expenses.filter(e => e.category === category.name), range)` — group
   by subcategory name, sort descending by value.

5. **JSX structure — replace the entire modal body content with:**

   ```
   [Period selector tab strip — All / 1Y / 6M / 3M]
   [Total for selected period — right-aligned, bold]
   [Bar chart of subcategory values for selected period]
   [Breakdown table: subcategory | amount | % — for selected period]
   ```

   The period selector should visually match the tab strip already used in
   `CategoryBreakdown.tsx` (gray pill container, white active tab, violet text when
   active, same `text-[10px]` sizing). Use `TIME_RANGE_OPTIONS` to render the tabs.

6. The bar chart stays as a `<BarChart>` from recharts using the same styling as the
   existing monthly bar chart (same axis, tooltip, cell colouring by `category.color`
   with decreasing `fillOpacity`).

7. If `chartData.length === 0`, show the same empty state: grey box with "No expenses
   in this period".

8. Remove the now-unused `allTimeData`, `allTimeTotal`, `monthData`, `monthTotal`
   variables from the memo.

9. The modal title stays the same: `${category.icon} ${category.name} — Subcategory Breakdown`.

10. Do not change the `SubcategoryBreakdownProps` interface or how this component is
    called from `CategoryBreakdown.tsx`.

---

### Task 2.2 — Monthly donut chart click → subcategory breakdown for that month

**File:** `src/components/dashboard/MonthlyDonutChart.tsx`

**Current behaviour:** Clicking a donut segment does nothing.

**Target behaviour:** Clicking a category segment opens an inline sub-panel (not a
separate modal — keep it within the same card) showing the subcategory breakdown for
that category in the currently selected month. Clicking again (or clicking a ✕ button)
closes it.

**Detailed implementation:**

1. Add a new state: `const [selectedCategory, setSelectedCategory] = useState<string | null>(null);`

2. On the `<Pie>` element, add:
   ```jsx
   onClick={(entry) => {
     const name = entry?.name as string | undefined;
     if (!name) return;
     setSelectedCategory((prev) => (prev === name ? null : name));
   }}
   style={{ cursor: "pointer" }}
   ```

3. When `monthKey` changes (the month navigator is used), reset `selectedCategory` to
   `null`. Do this with a `useEffect` that depends on `[monthKey]`.

4. Add a `subData` memo that derives subcategory breakdown for `selectedCategory` in
   `monthKey`:
   ```ts
   const subData = useMemo(() => {
     if (!selectedCategory) return [];
     const map: Record<string, number> = {};
     expenses
       .filter((e) => e.date.startsWith(monthKey) && e.category === selectedCategory)
       .forEach((e) => {
         const sub = e.subcategory || "General";
         map[sub] = (map[sub] || 0) + e.amount;
       });
     return Object.entries(map)
       .map(([name, value]) => ({ name, value }))
       .sort((a, b) => b.value - a.value);
   }, [expenses, monthKey, selectedCategory]);
   ```

5. After the existing legend list (`data.map(...)`) and before the closing `</div>` of
   the hasData branch, add a conditional sub-panel:

   ```jsx
   {selectedCategory && subData.length > 0 && (
     <div className="w-full mt-3 pt-3 border-t border-gray-100">
       <div className="flex items-center justify-between mb-2">
         <p className="text-xs font-semibold text-gray-700">
           {getCategoryConfig(selectedCategory, categories).icon} {selectedCategory}
         </p>
         <button
           onClick={() => setSelectedCategory(null)}
           className="text-[10px] text-gray-400 hover:text-gray-600"
         >
           ✕ close
         </button>
       </div>
       {subData.map((row) => {
         const subTotal = subData.reduce((s, r) => s + r.value, 0);
         const pct = subTotal > 0 ? (row.value / subTotal) * 100 : 0;
         const config = getCategoryConfig(selectedCategory, categories);
         return (
           <div key={row.name} className="flex flex-col gap-0.5 mb-1.5">
             <div className="flex items-center justify-between">
               <span className="text-xs text-gray-600">{row.name}</span>
               <span className="text-xs font-medium text-gray-700">
                 {formatCurrency(row.value)}
               </span>
             </div>
             <div className="w-full bg-gray-100 rounded-full h-1">
               <div
                 className="h-1 rounded-full"
                 style={{ width: `${pct}%`, backgroundColor: config.color }}
               />
             </div>
           </div>
         );
       })}
     </div>
   )}
   ```

6. Highlight the selected segment in the legend: in the existing `data.map(...)` legend
   items, add a conditional `font-semibold` and a subtle background highlight
   (`bg-violet-50 rounded px-1`) when `entry.name === selectedCategory`.

7. Do not change the month navigator, chart sizing, tooltip, or any other part of the file.

---

### Phase 2 — Verification checklist

- [ ] Open the dashboard. Click on any segment of the "By Category" all-time donut chart.
      The modal opens and defaults to "All time" period showing all subcategory bars.
- [ ] In the modal, click "1Y", "6M", "3M" — the bar chart and totals update correctly.
- [ ] Clicking a period with no data shows the "No expenses in this period" empty state.
- [ ] Open the dashboard. Click on any segment of the "Monthly Breakdown" donut chart.
      A sub-panel appears below the legend showing subcategory bars for that category.
- [ ] Use the month navigator — the sub-panel resets (closes) when the month changes.
- [ ] Click the same segment again — the sub-panel closes.
- [ ] Click ✕ — the sub-panel closes.
- [ ] No console errors.

```bash
git add -A
git commit -m "Phase 2: Chart interactions — period selector in subcategory modal, monthly donut click drill-down"
```

---

## Phase 3 — Category & Subcategory Deletion Logic

**Files touched:** `src/app/categories/page.tsx`, `src/hooks/useCategories.ts`,
`src/hooks/useExpenses.ts`

**Risk:** High. This touches Supabase data. Test with sample/test data first.
Make sure you have a working JSON export backup before running this phase in production.

> **Before starting Phase 3:** Export your current expenses via the app's export
> feature (JSON format). Keep the file safe. If anything goes wrong, you can reimport.

---

### Task 3.1 — Add `deleteCategoryWithExpenses` to `useExpenses`

**File:** `src/hooks/useExpenses.ts`

Add a new exported callback called `deleteCategoryWithExpenses` that deletes **all
expenses** belonging to a given category name from both local state and Supabase.

```ts
const deleteCategoryWithExpenses = useCallback(
  async (categoryName: string): Promise<void> => {
    // Optimistic local update
    setExpenses((prev) => prev.filter((e) => e.category !== categoryName));
    // Supabase delete
    const { error: e } = await supabase
      .from("expenses")
      .delete()
      .eq("user_id", user!.id)
      .eq("category", categoryName);
    if (e) setError(e.message);
  },
  [user]
);
```

Add `deleteCategoryWithExpenses` to the hook's return object.

**Do not modify** any existing callback. Do not change the return type structure.

---

### Task 3.2 — Protect "General" subcategory from deletion in `useCategories`

**File:** `src/hooks/useCategories.ts`

In the `deleteSubcategory` callback, add a guard at the very top:

```ts
const deleteSubcategory = useCallback(
  (categoryId: string, subcategoryId: string): void => {
    const cat = categories.find((c) => c.id === categoryId);
    const sub = cat?.subcategories.find((s) => s.id === subcategoryId);
    // Guard: never delete the "General" subcategory directly
    if (sub?.name === "General") return;
    // ... rest of existing logic unchanged
  },
  [categories, user]
);
```

This is a silent guard (no error thrown) — the UI will also enforce this visually
(see Task 3.3), so this is a belt-and-suspenders safety net.

---

### Task 3.3 — Rewrite category and subcategory deletion UX in categories page

**File:** `src/app/categories/page.tsx`

This is the most involved task. Read the entire current file before making any changes.

#### 3.3a — Import `deleteCategoryWithExpenses` from `useExpenses`

In the `useExpenses()` destructuring line, add `deleteCategoryWithExpenses`:

```ts
const { bulkMigrateCategory, bulkMigrateSubcategory, bulkRenameCategory,
        bulkRenameSubcategory, deleteCategoryWithExpenses } = useExpenses();
```

#### 3.3b — Add expense count helpers (for warning messages)

After the hook calls, add two helper constants:

```ts
const { expenses } = useExpenses(); // add `expenses` to the existing destructure above

// Count expenses per category (for delete warning)
const expenseCountByCategory = useMemo(() => {
  const map: Record<string, number> = {};
  expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + 1; });
  return map;
}, [expenses]);

// Count expenses per subcategory within a category
const expenseCountBySubcategory = useMemo(() => {
  const map: Record<string, Record<string, number>> = {};
  expenses.forEach((e) => {
    if (!map[e.category]) map[e.category] = {};
    const sub = e.subcategory || "General";
    map[e.category][sub] = (map[e.category][sub] || 0) + 1;
  });
  return map;
}, [expenses]);
```

Note: add `useMemo` to the React import if it is not already there.
Add `expenses` to the `useExpenses()` destructure (it's already returned by the hook).

#### 3.3c — Rewrite `handleDeleteCategory`

Replace the existing `handleDeleteCategory` function with:

```ts
const handleDeleteCategory = async () => {
  if (modal?.type !== "delete-category") return;
  const cat = modal.category;
  // Delete all expenses in this category from Supabase + local state
  await deleteCategoryWithExpenses(cat.name);
  // Delete the category itself
  deleteCategory(cat.id);
  addToast("success", `"${cat.name}" and all its expenses have been deleted.`);
  closeModal();
};
```

#### 3.3d — Rewrite `handleDeleteSubcategory`

Replace the existing `handleDeleteSubcategory` function with:

```ts
const handleDeleteSubcategory = () => {
  if (modal?.type !== "delete-subcategory") return;
  const { category, subcategory } = modal;
  // Move expenses to General, then remove the subcategory
  bulkMigrateSubcategory(category.name, subcategory.name, "General");
  deleteSubcategory(category.id, subcategory.id);
  addToast("success", `"${subcategory.name}" deleted. Expenses moved to "General".`);
  closeModal();
};
```

#### 3.3e — Update the Delete Category modal warning message

In the JSX for the "Delete Category" modal, replace the current warning text with a
dynamic message that shows the actual expense count:

```jsx
{modal?.type === "delete-category" && (() => {
  const count = expenseCountByCategory[modal.category.name] ?? 0;
  const subCount = modal.category.subcategories.length;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Delete &quot;{modal.category.name}&quot;?
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This will permanently delete the category along with{" "}
            <span className="font-semibold text-red-600">
              {subCount} subcategor{subCount !== 1 ? "ies" : "y"}
            </span>{" "}
            and{" "}
            <span className="font-semibold text-red-600">
              {count} expense{count !== 1 ? "s" : ""}
            </span>
            . This cannot be undone.
          </p>
          {count === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              No expenses are currently assigned to this category.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={closeModal}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleDeleteCategory}
          className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
          Delete Everything
        </button>
      </div>
    </div>
  );
})()}
```

#### 3.3f — Update the Delete Subcategory modal + block "General" deletion

In the JSX for the "Delete Subcategory" modal, make two changes:

**1. Block "General" from being deleted** — if the subcategory name is "General", show
a different message instead of the delete confirmation:

```jsx
{modal?.type === "delete-subcategory" && (() => {
  const { category, subcategory } = modal;
  const isGeneral = subcategory.name === "General";
  const count = expenseCountBySubcategory[category.name]?.[subcategory.name] ?? 0;

  if (isGeneral) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Cannot delete &quot;General&quot;
            </p>
            <p className="text-xs text-gray-500 mt-1">
              The &quot;General&quot; subcategory is required in every category. It acts
              as the default destination for expenses when other subcategories are deleted.
              To remove it, delete the entire &quot;{category.name}&quot; category instead.
            </p>
          </div>
        </div>
        <button onClick={closeModal}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Got it
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Delete &quot;{subcategory.name}&quot;?
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-semibold text-red-600">
              {count} expense{count !== 1 ? "s" : ""}
            </span>{" "}
            will be moved to &quot;General&quot; under &quot;{category.name}&quot;.
            This cannot be undone.
          </p>
          {count === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              No expenses are currently assigned to this subcategory.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={closeModal}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleDeleteSubcategory}
          className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
          Delete & Move
        </button>
      </div>
    </div>
  );
})()}
```

**2. Also disable the delete button for "General" in the subcategory list** — in the
subcategory row, the delete `<button>` currently has `disabled={cat.subcategories.length <= 1}`.
Change this condition to:

```jsx
disabled={sub.name === "General" || cat.subcategories.length <= 1}
title={
  sub.name === "General"
    ? "The General subcategory cannot be deleted"
    : cat.subcategories.length <= 1
    ? "Cannot delete the only subcategory"
    : "Delete subcategory"
}
```

---

### Phase 3 — Verification checklist

**Category deletion:**
- [ ] Delete a category that has expenses → modal shows the correct expense count and subcategory count
- [ ] Confirm deletion → category disappears, all its expenses disappear from the expenses page
- [ ] Delete a category with 0 expenses → modal shows "No expenses currently assigned" note
- [ ] After deletion, verify in Supabase (or refresh the app) that the expenses are truly gone

**Subcategory deletion — General protection:**
- [ ] The delete button for any "General" subcategory is visually disabled (greyed out)
- [ ] Clicking the disabled "General" delete button does nothing
- [ ] If somehow the modal opens for "General", it shows the "Cannot delete" amber warning, not the delete form

**Subcategory deletion — normal subcategory:**
- [ ] Delete a subcategory that has expenses → modal shows the correct expense count
- [ ] Confirm deletion → subcategory disappears, its expenses are now under "General" in the expenses page
- [ ] Delete a subcategory with 0 expenses → modal shows "No expenses currently assigned" note

```bash
git add -A
git commit -m "Phase 3: Category/subcategory deletion — cascade delete, General protection, dynamic warnings"
```

---

## Final merge (Option A)

Once all three phases are verified locally:

```bash
git push origin feature/spendy-improvements
```

Then on GitHub:
1. Click **"Compare & pull request"**
2. Set **base: main** ← **compare: feature/spendy-improvements**
3. Title: `feat: all Spendy improvements (Phases 1–3)`
4. Review the diff carefully — this is your last check before Vercel deploys
5. Click **"Merge pull request"** → **"Confirm merge"**

Sync locally:
```bash
git checkout main
git pull origin main
```

Optionally delete the feature branch:
```bash
# Delete locally
git branch -d feature/spendy-improvements
# Delete on GitHub
git push origin --delete feature/spendy-improvements
```

---

## Quick reference — files changed per phase

| Phase | Files |
|---|---|
| 1 | `src/components/dashboard/SummaryCards.tsx` |
| 1 | `src/components/Navigation.tsx` |
| 1 | `src/components/dashboard/MonthlyDonutChart.tsx` |
| 1 | `src/app/login/page.tsx` |
| 2 | `src/components/dashboard/SubcategoryBreakdown.tsx` |
| 2 | `src/components/dashboard/MonthlyDonutChart.tsx` |
| 3 | `src/hooks/useExpenses.ts` |
| 3 | `src/hooks/useCategories.ts` |
| 3 | `src/app/categories/page.tsx` |

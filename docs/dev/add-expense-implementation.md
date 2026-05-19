# Add Expense — Developer Implementation Guide

> **User guide:** [How to Add an Expense](../user/how-to-add-expense.md)

---

## Overview

The **Add Expense** feature lets users record a single expense with a date, amount, category, subcategory, and description. It also doubles as the **Edit Expense** flow — the same `ExpenseForm` component is reused with `initialData` populated for edits.

All data is persisted entirely client-side via `localStorage`. There is no backend.

---

## Architecture & Data Flow

```
/expenses page  (src/app/expenses/page.tsx)
      │
      │  opens Modal on "Add Expense" click
      ▼
  <Modal>  (src/components/ui/Modal.tsx)
      │
      ▼
  <ExpenseForm>  (src/components/expenses/ExpenseForm.tsx)
      │
      │  calls onSubmit(ExpenseFormData) on valid submit
      ▼
  handleAdd()  (expenses/page.tsx)
      │
      ▼
  useExpenses.addExpense(data)  (src/hooks/useExpenses.ts)
      │
      ▼
  useLocalStorage.setStoredValue()  (src/hooks/useLocalStorage.ts)
      │
      ├── localStorage.setItem("expenses", JSON.stringify([...]))
      │
      └── returns { quotaExceeded: boolean }
```

---

## TypeScript Types

**`src/types/expense.ts`**

| Type | Purpose |
|---|---|
| `ExpenseFormData` | Raw form values (all strings, including `amount`) |
| `Expense` | Persisted record — `amount` is `number`, adds `id`, `createdAt`, `updatedAt` |
| `CategoryData` | Category with `id`, `name`, `icon`, color tokens, `subcategories[]` |
| `Subcategory` | `{ id: string; name: string }` |

```ts
interface ExpenseFormData {
  date: string;        // "YYYY-MM-DD"
  amount: string;      // raw text — parsed to float on save
  category: string;    // category name
  subcategory: string; // subcategory name
  description: string;
}

interface Expense {
  id: string;          // `${Date.now()}-${random}`
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  description: string;
  createdAt: string;   // ISO timestamp
  updatedAt: string;
}
```

---

## Validation Rules

All validation lives in the `validate()` function at the top of `ExpenseForm.tsx:25`.

| Field | Rules |
|---|---|
| `date` | Required. Cannot be in the future (`> today()`). |
| `amount` | Required. Must match `/^\d*\.?\d+$/`. Must be `> 0`. Must be `<= 1,000,000`. |
| `category` | Required (always pre-selected, so only fails programmatically). |
| `subcategory` | Required (always pre-selected from category's first subcategory). |
| `description` | Required. Trimmed length must be `>= 2` and `<= 200`. |

Validation is **eager-on-blur, lazy-on-change**: a field is validated on first blur, then re-validated on every keystroke while `touched[field]` is true. On submit, all fields are marked touched and fully validated before `onSubmit` is called.

---

## Component: `ExpenseForm`

**File:** `src/components/expenses/ExpenseForm.tsx`

### Props

```ts
interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  initialData?: Expense;       // omit for add, pass for edit
  categories?: CategoryData[]; // falls back to DEFAULT_CATEGORIES
  isSubmitting?: boolean;      // disables submit button
}
```

### State

| State | Type | Purpose |
|---|---|---|
| `form` | `ExpenseFormData` | Controlled form values |
| `errors` | `FormErrors` | Per-field error strings |
| `touched` | `Partial<Record<keyof FormErrors, boolean>>` | Tracks which fields have been blurred |

### Subcategory Reset

When `form.category` changes (via the category icon grid), a `useEffect` resets `form.subcategory` to the first subcategory of the newly selected category. A `useRef` guard (`categoryChangeMounted`) skips this reset on initial mount so that `initialData.subcategory` is preserved when editing.

```ts
// ExpenseForm.tsx:74–83
useEffect(() => {
  if (!categoryChangeMounted.current) {
    categoryChangeMounted.current = true;
    return;
  }
  const cat = categories.find((c) => c.name === form.category);
  const firstSub = cat?.subcategories[0]?.name ?? "General";
  setForm((f) => ({ ...f, subcategory: firstSub }));
}, [form.category]);
```

### Submit Flow

1. `handleSubmit` marks all fields as touched.
2. Calls `validate(form)` — if any errors, sets them in state and returns early.
3. Calls `onSubmit(form)` — the parent page handles persistence.

### Category Picker UI

The category field renders as a **3-column icon button grid** (max height `13rem`, scrollable). Each button shows the category emoji icon and name. The selected button applies `bgColor`, `textColor`, and a `ring-2` border from the category's color tokens.

---

## Hook: `useExpenses`

**File:** `src/hooks/useExpenses.ts`

### `addExpense(data: ExpenseFormData)`

```ts
// useExpenses.ts:57–75
const addExpense = (data: ExpenseFormData): { expense?: Expense; quotaExceeded?: boolean } => {
  const now = new Date().toISOString();
  const expense: Expense = {
    id: generateId(),              // `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    date: data.date,
    amount: parseFloat(data.amount),
    category: data.category,
    subcategory: data.subcategory || "General",
    description: data.description.trim(),
    createdAt: now,
    updatedAt: now,
  };
  const result = setExpenses((prev) => [expense, ...prev]); // prepend — newest first
  if (result.quotaExceeded) return { quotaExceeded: true };
  return { expense };
};
```

New expenses are **prepended** to the array so they appear at the top of the list without needing a re-sort.

### `updateExpense(id, data)`

Same shape as `addExpense` but maps over the existing array and updates the matching record in-place, preserving `createdAt` and updating `updatedAt`.

### ID Generation

```ts
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

Collision probability is negligible for client-side use.

---

## Hook: `useLocalStorage`

**File:** `src/hooks/useLocalStorage.ts`

Wraps `localStorage` with React state. Key behaviour:

- Reads from `localStorage` once on mount (inside `useEffect`) and sets `isLoaded = true` when done.
- `setStoredValue` catches `QuotaExceededError` / `NS_ERROR_DOM_QUOTA_REACHED` (Firefox) and returns `{ quotaExceeded: true }` instead of throwing.
- Uses a `valueRef` to avoid stale-closure issues in the setter — the functional updater always receives the latest persisted array.

**Storage key for expenses:** `"expenses"`  
**Storage limit:** 5 MB (tracked in `src/utils/storage.ts`)

---

## Page: `/expenses`

**File:** `src/app/expenses/page.tsx`

### Opening the Form

The "Add Expense" button (`Plus` icon, violet) sets `showAddForm = true`, which opens a `<Modal>` containing `<ExpenseForm>`.

### `handleAdd(data)`

```ts
const handleAdd = (data: ExpenseFormData) => {
  const result = addExpense(data);
  if (result.quotaExceeded) {
    setShowStorageFull(true); // shows StorageFullModal
    return;
  }
  setShowAddForm(false);
  addToast("success", "Expense added!");
};
```

On success: closes the modal and shows a green toast for ~3 s.  
On quota exceeded: shows `StorageFullModal` (export + delete options).

### Empty State

When `expenses.length === 0`, the page renders a centred empty state with an **"Add First Expense"** button (same handler as the top-right button) and an **"Import JSON Backup"** button.

---

## Categories: Default vs Custom

`ExpenseForm` accepts an optional `categories` prop. If omitted or empty, it falls back to `DEFAULT_CATEGORIES` (defined in `src/utils/categories.ts`):

| Name | Icon | Color |
|---|---|---|
| Food | 🍽️ | Orange |
| Transportation | 🚗 | Blue |
| Entertainment | 🎬 | Purple |
| Shopping | 🛍️ | Pink |
| Bills | 📄 | Red |
| Other | 📦 | Gray |

Custom categories created via `/categories` are loaded from `useCategories()` and passed down through the page.

---

## Storage Quota Handling

When `localStorage.setItem` throws `QuotaExceededError`:

1. `useLocalStorage` returns `{ quotaExceeded: true }` without updating in-memory state.
2. `addExpense` / `updateExpense` propagates this to the caller.
3. `handleAdd` / `handleUpdate` on the page renders `<StorageFullModal>`, offering the user options to export a JSON backup or navigate to the expense list to delete old entries.

---

## Edit Expense

Editing reuses `<ExpenseForm>` with `initialData={editingExpense}`. The page renders a separate `<Modal>` for the edit form (controlled by `editingExpense` state). The submit handler calls `updateExpense(editingExpense.id, data)`.

---

## Related Developer Docs

- [Category Management Implementation](./category-implementation.md) — how custom categories and subcategories are stored and managed (if/when created)

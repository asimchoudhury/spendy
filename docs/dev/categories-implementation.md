# Categories & Subcategories — Implementation Guide

**Stack layer:** Frontend  
**Last updated:** 2026-05-19

> **User-facing guide:** [How to Manage Categories](../user/how-to-manage-categories.md)  
> **Related dev doc:** [Add Expense Implementation](./add-expense-implementation.md)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-05-19 | — | Initial documentation |

---

## Overview

Categories are the primary classification dimension for expenses. Each category has zero or more **subcategories** that provide finer-grained grouping. Both levels live entirely in `localStorage` — there is no backend.

The feature spans:

| File | Role |
|------|------|
| `src/app/categories/page.tsx` | Page: UI for all CRUD operations |
| `src/hooks/useCategories.ts` | State management + localStorage writes |
| `src/hooks/useExpenses.ts` | Bulk rename/migrate helpers for referential integrity |
| `src/hooks/useLocalStorage.ts` | Generic localStorage wrapper (SSR-safe) |
| `src/types/expense.ts` | `CategoryData` and `Subcategory` TypeScript interfaces |
| `src/utils/categories.ts` | Defaults, validation, color palette, icon suggestion |
| `src/components/ui/IconPicker.tsx` | Emoji picker grid component |

---

## Data Model

```ts
// src/types/expense.ts

interface Subcategory {
  id: string;   // timestamp-random, e.g. "1716100000000-a3f9b2c"
  name: string;
}

interface CategoryData {
  id: string;
  name: string;
  color: string;     // hex, e.g. "#f97316"   — used in charts
  bgColor: string;   // Tailwind class, e.g. "bg-orange-100"
  textColor: string; // Tailwind class, e.g. "text-orange-700"
  icon: string;      // single emoji, e.g. "🍽️"
  subcategories: Subcategory[];
}
```

`Expense` stores category and subcategory **by name** (not ID). This means renaming a category or subcategory requires a bulk update across all expenses — see [Referential Integrity](#referential-integrity) below.

---

## Storage

`useLocalStorage<CategoryData[]>("categories", [])` — persisted under the key `"categories"` in localStorage.

`useLocalStorage` returns `[value, setter, isLoaded]`. The setter:
- Accepts a value or updater function (like `setState`).
- Returns `{ quotaExceeded: boolean }` — callers must check this and surface `<StorageFullModal>` when true.
- Never throws on quota errors.

On the **first load** (`categories.length === 0` after `isLoaded` becomes `true`), `useCategories` seeds `DEFAULT_CATEGORIES` (six built-ins).

---

## Default Categories

Defined in `src/utils/categories.ts` as `DEFAULT_CATEGORIES: CategoryData[]`.

| ID | Name | Icon | Color |
|----|------|------|-------|
| `food` | Food | 🍽️ | `#f97316` (orange) |
| `transportation` | Transportation | 🚗 | `#3b82f6` (blue) |
| `entertainment` | Entertainment | 🎬 | `#a855f7` (purple) |
| `shopping` | Shopping | 🛍️ | `#ec4899` (pink) |
| `bills` | Bills | 📄 | `#ef4444` (red) |
| `other` | Other | 📦 | `#6b7280` (gray) |

Each default has a single subcategory named `"General"` (e.g. `id: "food-general"`). User-created categories also start with a `"General"` subcategory.

---

## Color Assignment

`getNextColor(count: number)` in `src/utils/categories.ts` cycles through `COLOR_PALETTE` (10 entries) using `count % 10`. `count` is `categories.length` at the time of creation.

```ts
const COLOR_PALETTE = [
  { color: "#f97316", bgColor: "bg-orange-100", textColor: "text-orange-700" },
  { color: "#3b82f6", bgColor: "bg-blue-100",   textColor: "text-blue-700" },
  // ... 8 more
];
```

Color is assigned at creation time and never changes — even if subsequent categories are deleted.

---

## Icon System

### Auto-suggestion

`suggestIconForCategory(name: string): string` scans `ICON_KEYWORDS` (29 entries) for a case-insensitive keyword match in the name. Falls back to `"📁"`.

Auto-suggestion is active while typing a **new** category name. It is disabled as soon as the user manually picks an icon from `<IconPicker>`.

```ts
// page.tsx — auto-suggest logic
const handleNameChange = (v: string) => {
  setNameInput(v);
  if (autoSuggestIcon) setIconInput(suggestIconForCategory(v) || "📁");
};

const handleIconSelect = (icon: string) => {
  setIconInput(icon);
  setAutoSuggestIcon(false); // manual pick disables auto-suggest
};
```

When **editing** an existing category, `autoSuggestIcon` is always `false` so the saved icon is preserved.

### IconPicker Component

`src/components/ui/IconPicker.tsx` renders a 6-column grid of all 29 ICON_KEYWORDS emojis plus `"📁"`. The selected icon gets `ring-2 ring-violet-500 scale-110`. Clicking a new icon fires `onSelect`.

---

## Validation

Both `validateCategoryName` and `validateSubcategoryName` in `src/utils/categories.ts` apply the same rules:

| Rule | Error message |
|------|--------------|
| Empty after trim | `"Name cannot be empty"` |
| Length < 2 | `"Name must be at least 2 characters"` |
| Length > 50 | `"Name must be at most 50 characters"` |
| No letter present | `"Name must contain at least one letter"` |
| Fails regex `[a-zA-Z0-9 &\-_()']+` | `"Only letters, numbers, spaces and & - _ ( ) ' are allowed"` |
| Case-insensitive duplicate within same scope | `"A category with this name already exists"` / `"A subcategory with this name already exists"` |

For **edit** operations the `currentName` parameter is passed so the original name is excluded from duplicate checking (allowing a save without changing the name).

Validation fires:
- On **blur** of the name input (`handleNameBlur`).
- On every **keystroke** after the field has been touched.
- On **submit** (to catch untouched-but-empty submits).

---

## Modal Architecture

The page uses a **single discriminated union** for all six modal modes:

```ts
type ModalMode =
  | { type: "add-category" }
  | { type: "edit-category";    category: CategoryData }
  | { type: "delete-category";  category: CategoryData }
  | { type: "add-subcategory";  category: CategoryData }
  | { type: "edit-subcategory"; category: CategoryData; subcategory: Subcategory }
  | { type: "delete-subcategory"; category: CategoryData; subcategory: Subcategory };
```

There are three `<Modal>` instances rendered simultaneously at the bottom of the JSX:
1. **Name modal** — shown when `isNameModal` (add/edit, category or subcategory). Includes `<NameInput>` and, for category modes, `<IconPicker>`.
2. **Delete category modal** — destructive confirmation.
3. **Delete subcategory modal** — destructive confirmation.

Only the modal whose `isOpen` prop matches the current `modal?.type` is visible at once.

---

## CRUD Operations

### Add Category

```ts
addCategory(name: string, icon?: string): CategoryData
```

- Calls `getNextColor(categories.length)` for colour assignment.
- Automatically creates a `"General"` subcategory.
- Calls `setCategories(prev => [...prev, newCat])`.

After save: `bulkRenameCategory` is **not** called (new category, no existing expenses).

### Edit Category

```ts
updateCategory(id: string, name: string, icon?: string): void
```

Followed immediately by:

```ts
bulkRenameCategory(oldName: string, newName: string)
```

This rewrites `expense.category` on every matching expense in a single `setExpenses` call.

### Delete Category

```ts
bulkMigrateCategory(fromCategory, toCategory, toSubcategory)
deleteCategory(id)
```

`toCategory` is `categories.find(c => c.id !== cat.id) ?? DEFAULT_CATEGORIES[5]` — the first available other category, falling back to "Other". `toSubcategory` is hardcoded `"General"`.

### Add Subcategory

```ts
addSubcategory(categoryId: string, name: string): Subcategory
```

Appends to `category.subcategories`. No bulk expense update needed.

### Edit Subcategory

```ts
updateSubcategory(categoryId: string, subcategoryId: string, name: string): void
```

Followed immediately by:

```ts
bulkRenameSubcategory(category.name, oldName, newName)
```

### Delete Subcategory

```ts
bulkMigrateSubcategory(category.name, subcategory.name, "General")
deleteSubcategory(categoryId, subcategoryId)
```

Expenses move to `"General"` within the same parent category.

**Constraint:** The delete button is `disabled` when `cat.subcategories.length <= 1`. A category must always have at least one subcategory.

---

## Referential Integrity

Because `Expense.category` and `Expense.subcategory` store **names**, every rename and delete must sweep all expenses. The four helpers in `useExpenses`:

| Function | When called |
|----------|-------------|
| `bulkRenameCategory(old, new)` | After `updateCategory` |
| `bulkRenameSubcategory(cat, old, new)` | After `updateSubcategory` |
| `bulkMigrateCategory(from, to, toSub)` | Before `deleteCategory` |
| `bulkMigrateSubcategory(cat, from, toSub)` | Before `deleteSubcategory` |

All four are `useCallback`-memoised and call `setExpenses(prev => prev.map(...))` atomically.

---

## Import Integration

`importCategories(categoryNames: string[])` in `useCategories` is called by `<SmartImportModal>` during JSON import. It bulk-adds any category names found in the backup that don't already exist, using `suggestIconForCategory` and `getNextColor` for the new entries.

---

## `getCategoryConfig` Helper

`getCategoryConfig(name, categories?)` in `src/utils/categories.ts` is used by chart and badge components that need color/icon data but don't hold a full `CategoryData` reference. It checks the live `categories` array first, then falls back to `CATEGORY_CONFIG` (a static snapshot of the 6 defaults), then to a gray fallback. This ensures charts render correctly even when called before `useCategories` has loaded.

---

## Adding a New Category Field

1. Add the field to `CategoryData` in `src/types/expense.ts`.
2. Update `DEFAULT_CATEGORIES` and `addCategory` in `src/utils/categories.ts` / `useCategories.ts`.
3. Update `updateCategory` to accept and persist the new field.
4. Add UI for the field in the name modal section of `src/app/categories/page.tsx`.
5. Update `importCategories` if the field can come from backup data.

---

## Related Documentation

- [Add Expense Implementation](./add-expense-implementation.md) — how `category` / `subcategory` fields are selected in the expense form.

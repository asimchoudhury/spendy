# How to Manage Categories & Subcategories

> **Also see:** [How to Add an Expense](./how-to-add-expense.md) — learn how categories are used when recording a spend.  
> **Developer reference:** [Categories Implementation Guide](../dev/categories-implementation.md)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-05-19 | — | Initial guide |

---

## What Are Categories?

Categories are the buckets that group your expenses — for example **Food**, **Transport**, or **Bills**. Each category has at least one **subcategory** for finer detail (e.g. Food → Groceries, Dining Out). When you record an expense you pick both a category and a subcategory.

Spendy starts you off with six built-in categories. You can add your own, rename any of them, and delete ones you don't need.

---

## Opening the Categories Page

Click **Categories** in the top navigation bar. On mobile, tap the hamburger menu (☰) first.

```
┌────────────────────────────────────────────────────────────┐
│  🏠 Spendy   Dashboard  Expenses  Breakdown  Categories    │
└────────────────────────────────────────────────────────────┘
```

> **Screenshot placeholder — Categories page: navigation bar with "Categories" highlighted**

---

## The Categories List

The page shows a card for every category. Each card can be expanded (▼) or collapsed (▶) — all cards are expanded by default.

```
┌──────────────────────────────────────────────────────┐
│  🍽️  Food                             2 subcategories │  ✏️  🗑️
│  ────────────────────────────────────────────────    │
│    • General                                    ✏️ 🗑️ │
│    • Dining Out                                 ✏️ 🗑️ │
│    + Add subcategory                                  │
└──────────────────────────────────────────────────────┘
```

> **Screenshot placeholder — Categories page: full list of default categories, all expanded**

---

## Adding a New Category

1. Click the **Add Category** button (top-right of the page). On mobile it shows only a **+** icon.

   > **Screenshot placeholder — Categories page: "Add Category" button highlighted**

2. The **Add Category** modal opens. Type the category name in the text field.

   As you type, Spendy auto-suggests a matching icon — you'll see the label **auto-suggested** next to the icon preview.

   > **Screenshot placeholder — Add Category modal: name field being typed, "auto-suggested" label visible**

3. **Choose an icon** — the icon grid shows 30 emoji options. Click any emoji to select it; the current selection is highlighted with a purple ring. Once you manually pick an icon, auto-suggestion stops.

   > **Screenshot placeholder — Add Category modal: icon picker with one emoji highlighted**

4. Click **Add** to save. A green toast appears: _Category "…" added_.

   > **Screenshot placeholder — Categories page: new category card added, success toast visible**

### Name Rules

Your category name must:

- Be between **2 and 50 characters**.
- Contain **at least one letter**.
- Use only letters, numbers, spaces, and the characters `& - _ ( ) '`.

If any rule is broken, a red message appears below the input as soon as you leave the field or try to submit.

> **Screenshot placeholder — Add Category modal: validation error "A category with this name already exists"**

| What you typed | Error shown |
|---------------|-------------|
| _(empty)_ | Name cannot be empty |
| `A` | Name must be at least 2 characters |
| More than 50 chars | Name must be at most 50 characters |
| `123` | Name must contain at least one letter |
| `Food!` | Only letters, numbers, spaces and & - _ ( ) ' are allowed |
| `Food` _(already exists)_ | A category with this name already exists |

---

## Renaming a Category

1. Find the category card and click the **pencil icon** (✏️) on the right side of the category row.
2. The **Edit Category** modal opens with the current name and icon already filled in.
3. Edit the name and/or pick a new icon, then click **Save**.

   > **Screenshot placeholder — Edit Category modal: name pre-filled, icon picker shown**

All existing expenses assigned to this category are automatically updated to the new name — you won't lose any data.

---

## Deleting a Category

1. Click the **trash icon** (🗑️) on the right side of the category card.
2. A confirmation modal warns you that the action cannot be undone.

   > **Screenshot placeholder — Delete Category confirmation modal with warning banner**

3. Click **Delete** to confirm. All expenses that were in this category are **automatically moved** to another category (the next available one in your list, or "Other" as a last resort).

   A toast confirms: _Category "…" deleted. Expenses moved to "…"._

> **Tip:** If you want to move expenses to a specific category before deleting, edit each expense first from the Expenses page.

---

## Adding a Subcategory

1. Expand the category card by clicking its row (if it is collapsed).
2. Click **+ Add subcategory** at the bottom of the expanded list.
3. Type the subcategory name in the modal that opens and click **Add**.

   > **Screenshot placeholder — Add Subcategory modal: name field, "Add" and "Cancel" buttons**

The same name rules apply as for categories. The new subcategory will be available in the expense form immediately.

---

## Renaming a Subcategory

1. Hover over the subcategory row — edit and delete icons appear (on mobile they are always visible).
2. Click the **pencil icon** (✏️).
3. Edit the name and click **Save**.

   > **Screenshot placeholder — Subcategory row: hover state with pencil and trash icons visible**

All existing expenses that used this subcategory are automatically updated.

---

## Deleting a Subcategory

1. Hover over the subcategory row and click the **trash icon** (🗑️).
2. Confirm in the modal. Expenses in this subcategory are moved to **General** within the same parent category.

   > **Screenshot placeholder — Delete Subcategory confirmation modal**

### Cannot Delete the Last Subcategory

Every category must keep at least one subcategory. If a category has only one subcategory, its trash icon is greyed out and disabled.

> **Screenshot placeholder — Subcategory row: trash icon disabled/greyed when it's the only subcategory**

---

## Collapsing and Expanding Categories

Click anywhere on the category name row (the area with the icon, name, and subcategory count) to toggle the subcategory list open or closed. The chevron (▼ / ▶) shows the current state.

---

## Frequently Asked Questions

**Can I change the colour of a category?**  
Not directly — colours are assigned automatically when you create a category and cycle through a fixed palette. To get a different colour, delete and recreate the category (or reorder your categories so the count changes).

**What happens to my expenses if I rename a subcategory?**  
They are updated instantly and automatically. No manual work needed.

**Can I delete a default category like "Food"?**  
Yes. Default categories are not special — you can delete any category. Expenses will be migrated to another category automatically.

**Can I have the same subcategory name in two different categories?**  
Yes. Subcategory names only need to be unique within their parent category.

**How many subcategories can I add?**  
There is no hard limit beyond the ~5 MB localStorage quota shared with all your expense data.

---

## Related Guides

- [How to Add an Expense](./how-to-add-expense.md) — select category and subcategory when recording a spend.

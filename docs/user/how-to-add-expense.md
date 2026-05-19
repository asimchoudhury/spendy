# How to Add an Expense

> **For developers:** See the [technical implementation guide](../dev/add-expense-implementation.md).

---

Spendy makes it quick to record any expense. This guide walks you through every step — including what to do if something goes wrong.

---

## Step 1 — Go to the Expenses page

Click **Expenses** in the navigation bar at the bottom (mobile) or left sidebar (desktop).

```
┌────────────────────────────────────────┐
│  Spendy                                │
│                                        │
│  Dashboard   Expenses   Breakdown  ... │
│                ^^^^^^^^                │
└────────────────────────────────────────┘
```

---

## Step 2 — Click "Add Expense"

In the top-right corner of the Expenses page you will see a **violet "+ Add Expense" button**.

```
┌─────────────────────────────────────────────────┐
│  Expenses                      [Export] [Import] │
│  0 total expenses               [+ Add Expense] │◄──
└─────────────────────────────────────────────────┘
```

On a narrow screen (mobile) only the **+** icon is shown — the label is hidden to save space.

> **First time here?** If you have no expenses yet, you will see an empty state with an **"Add First Expense"** button in the centre of the page. Clicking it opens the same form.

---

## Step 3 — Fill in the form

A modal dialog opens with five fields.

```
┌──────────────────────────────────────┐
│  Add Expense                      ✕  │
├──────────────────────────────────────┤
│  Date                                │
│  [ 2026-05-17 ▼ ]                   │
│                                      │
│  Amount (₹)                          │
│  [ ₹  0.00          ]               │
│                                      │
│  Category                            │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │  🍽️  │ │  🚗  │ │  🎬  │  ...   │
│  │ Food │ │Trans.│ │ Ent. │         │
│  └──────┘ └──────┘ └──────┘         │
│                                      │
│  Subcategory                         │
│  [ General           ▼ ]            │
│                                      │
│  Description                         │
│  [ What was this expense for?  ]     │
│                                      │
│  [ Cancel ]         [ Add Expense ]  │
└──────────────────────────────────────┘
```

### Date

Defaults to **today**. Tap or click the field to pick a different day using the browser's native date picker. You cannot select a future date — the calendar blocks dates after today.

### Amount (₹)

Type the amount in rupees. Decimals are allowed (e.g. `149.50`). You do not need to type the `₹` symbol — it is shown automatically as a prefix.

### Category

Tap one of the coloured icon buttons. The selected category gets a highlighted border and colour fill. Scroll the grid if you have more than six categories.

The subcategory list below updates automatically when you switch category.

### Subcategory

Pick from the dropdown. The options shown are the subcategories that belong to the selected category.

### Description

A short note about what the expense was for (e.g. "Lunch at Café Coffee Day"). Must be between **2 and 200 characters**.

---

## Step 4 — Save

Click **Add Expense**. The modal closes and a green **"Expense added!"** banner appears briefly at the bottom of the screen.

```
┌──────────────────────────────────────────┐
│                                          │
│           ✓  Expense added!              │◄── green toast
│                                          │
└──────────────────────────────────────────┘
```

Your new expense appears at the **top** of the expense list, sorted newest first.

---

## What if I make a mistake?

### Validation errors

If you tap **Add Expense** with missing or invalid values, each problem field shows a red error message beneath it.

```
┌──────────────────────────────────────┐
│  Amount (₹)                          │
│  [ ₹  -50          ]  ← red border  │
│  ✗ Amount must be greater than zero  │◄── error hint
└──────────────────────────────────────┘
```

| What you entered | Error shown |
|---|---|
| No date | "Date is required" |
| A future date | "Date cannot be in the future" |
| Empty amount | "Amount is required" |
| Letters in amount (e.g. `abc`) | "Enter a valid positive number (no letters)" |
| Zero or negative amount | "Amount must be greater than zero" |
| Amount over ₹10,00,000 | "Amount seems too large" |
| No description | "Description is required" |
| Description under 2 characters | "Description is too short" |
| Description over 200 characters | "Description is too long" |

Fix the highlighted fields and click **Add Expense** again.

### Pressing Cancel

Clicking **Cancel** or the **✕** button closes the form without saving anything.

---

## Storage full warning

Spendy stores all data in your browser's local storage (up to **5 MB**). If you are close to that limit when saving, you will see a warning:

```
┌──────────────────────────────────────────┐
│  Storage Almost Full                     │
│                                          │
│  You're running low on space.            │
│  Export a backup or delete old expenses  │
│  to free up room.                        │
│                                          │
│  [ Export JSON Backup ]  [ Manage ]      │
└──────────────────────────────────────────┘
```

- **Export JSON Backup** — downloads a `.json` file of all your expenses so you can re-import them later.
- **Manage** — takes you to the Expenses list so you can delete entries you no longer need.

After freeing up space, try adding the expense again.

---

## Editing an expense you already added

On the Expenses page, tap any expense card and choose **Edit**. The same form opens, pre-filled with the existing values. Change what you need and click **Update Expense**.

> For more on managing existing expenses, see the [Expenses List guide](./how-to-manage-expenses.md) (if available).

---

## Tips

- The date defaults to today — you only need to change it for past expenses.
- You can type decimal amounts such as `12.50`.
- Custom categories you create on the **Categories** page appear here automatically.
- Expenses are sorted newest-first, so your latest entry is always at the top.

"use client";

import { useState, useEffect, useRef } from "react";
import { Expense, ExpenseFormData, CategoryData } from "@/types/expense";
import { DEFAULT_CATEGORIES } from "@/utils/categories";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  initialData?: Expense;
  categories?: CategoryData[];
  isSubmitting?: boolean;
}

const today = () => new Date().toISOString().split("T")[0];

interface FormErrors {
  date?: string;
  amount?: string;
  category?: string;
  subcategory?: string;
  description?: string;
}

function validate(data: ExpenseFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.date) errors.date = "Date is required";
  else if (data.date > today()) errors.date = "Date cannot be in the future";

  const raw = data.amount;
  if (!raw) {
    errors.amount = "Amount is required";
  } else if (!/^\d*\.?\d+$/.test(raw)) {
    errors.amount = "Enter a valid positive number (no letters)";
  } else {
    const amount = parseFloat(raw);
    if (isNaN(amount) || amount <= 0) errors.amount = "Amount must be greater than zero";
    else if (amount > 1_000_000) errors.amount = "Amount seems too large";
  }

  if (!data.category) errors.category = "Category is required";
  if (!data.subcategory) errors.subcategory = "Subcategory is required";

  if (!data.description.trim()) errors.description = "Description is required";
  else if (data.description.trim().length < 2) errors.description = "Description is too short";
  else if (data.description.trim().length > 200) errors.description = "Description is too long";

  return errors;
}

export function ExpenseForm({
  onSubmit,
  onCancel,
  initialData,
  categories: categoriesProp,
  isSubmitting,
}: ExpenseFormProps) {
  const categories = categoriesProp && categoriesProp.length > 0 ? categoriesProp : DEFAULT_CATEGORIES;

  const defaultCategory = categories[0]?.name ?? "Food";
  const defaultSubcategory = categories[0]?.subcategories[0]?.name ?? "General";

  const [form, setForm] = useState<ExpenseFormData>({
    date: initialData?.date ?? today(),
    amount: initialData ? String(initialData.amount) : "",
    category: initialData?.category ?? defaultCategory,
    subcategory: initialData?.subcategory ?? defaultSubcategory,
    description: initialData?.description ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
  const categoryChangeMounted = useRef(false);

  // Reset subcategory when category changes, but skip the initial mount (to preserve initialData.subcategory)
  useEffect(() => {
    if (!categoryChangeMounted.current) {
      categoryChangeMounted.current = true;
      return;
    }
    const cat = categories.find((c) => c.name === form.category);
    const firstSub = cat?.subcategories[0]?.name ?? "General";
    setForm((f) => ({ ...f, subcategory: firstSub }));
  }, [form.category]); // eslint-disable-line react-hooks/exhaustive-deps

  const subcategories =
    categories.find((c) => c.name === form.category)?.subcategories ?? [];

  const set = (field: keyof ExpenseFormData, value: string) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field as keyof FormErrors]) {
      const errs = validate(updated);
      setErrors((e) => ({ ...e, [field]: errs[field as keyof FormErrors] }));
    }
  };

  const blur = (field: keyof FormErrors) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const errs = validate(form);
    setErrors((e) => ({ ...e, [field]: errs[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Partial<Record<keyof FormErrors, boolean>> = {
      date: true,
      amount: true,
      category: true,
      subcategory: true,
      description: true,
    };
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit(form);
    }
  };

  const fieldWrapper = (
    label: string,
    key: keyof FormErrors,
    children: React.ReactNode
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {errors[key] && touched[key] && (
        <p className="text-xs text-red-500 mt-0.5">{errors[key]}</p>
      )}
    </div>
  );

  const inputClass = (key: keyof FormErrors) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-violet-500/30 ${
      errors[key] && touched[key]
        ? "border-red-300 bg-red-50 focus:border-red-400"
        : "border-gray-300 bg-white focus:border-violet-400"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fieldWrapper(
        "Date",
        "date",
        <input
          type="date"
          max={today()}
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
          onBlur={() => blur("date")}
          className={inputClass("date")}
        />
      )}

      {fieldWrapper(
        "Amount (₹)",
        "amount",
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            ₹
          </span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            onBlur={() => blur("amount")}
            className={`${inputClass("amount")} pl-7`}
          />
        </div>
      )}

      {fieldWrapper(
        "Category",
        "category",
        <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const selected = form.category === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => set("category", cat.name)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  selected
                    ? `${cat.bgColor} ${cat.textColor} border-current ring-2 ring-current/30`
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="truncate w-full text-center">{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {fieldWrapper(
        "Subcategory",
        "subcategory",
        <select
          value={form.subcategory}
          onChange={(e) => set("subcategory", e.target.value)}
          onBlur={() => blur("subcategory")}
          className={inputClass("subcategory")}
        >
          {subcategories.map((sub) => (
            <option key={sub.id} value={sub.name}>
              {sub.name}
            </option>
          ))}
          {subcategories.length === 0 && (
            <option value="General">General</option>
          )}
        </select>
      )}

      {fieldWrapper(
        "Description",
        "description",
        <textarea
          rows={2}
          placeholder="What was this expense for?"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          onBlur={() => blur("description")}
          className={`${inputClass("description")} resize-none`}
        />
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Saving..." : initialData ? "Update Expense" : "Add Expense"}
        </button>
      </div>
    </form>
  );
}

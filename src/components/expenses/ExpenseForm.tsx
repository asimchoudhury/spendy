"use client";

import { useState, useEffect } from "react";
import { Expense, ExpenseFormData, Category } from "@/types/expense";
import { CATEGORIES } from "@/utils/categories";
import { CATEGORY_CONFIG } from "@/utils/categories";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  onCancel: () => void;
  initialData?: Expense;
  isSubmitting?: boolean;
}

const today = () => new Date().toISOString().split("T")[0];

function validate(data: ExpenseFormData): Partial<Record<keyof ExpenseFormData, string>> {
  const errors: Partial<Record<keyof ExpenseFormData, string>> = {};
  if (!data.date) errors.date = "Date is required";
  else if (data.date > today()) errors.date = "Date cannot be in the future";

  const amount = parseFloat(data.amount);
  if (!data.amount) errors.amount = "Amount is required";
  else if (isNaN(amount) || amount <= 0) errors.amount = "Enter a valid positive amount";
  else if (amount > 1_000_000) errors.amount = "Amount seems too large";

  if (!data.description.trim()) errors.description = "Description is required";
  else if (data.description.trim().length < 2) errors.description = "Description is too short";
  else if (data.description.trim().length > 200) errors.description = "Description is too long";

  return errors;
}

export function ExpenseForm({ onSubmit, onCancel, initialData, isSubmitting }: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>({
    date: initialData?.date ?? today(),
    amount: initialData ? String(initialData.amount) : "",
    category: initialData?.category ?? "Food",
    description: initialData?.description ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ExpenseFormData, boolean>>>({});

  const set = (field: keyof ExpenseFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (touched[field]) {
      const errs = validate({ ...form, [field]: value });
      setErrors((e) => ({ ...e, [field]: errs[field] }));
    }
  };

  const blur = (field: keyof ExpenseFormData) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const errs = validate(form);
    setErrors((e) => ({ ...e, [field]: errs[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = Object.fromEntries(
      (Object.keys(form) as (keyof ExpenseFormData)[]).map((k) => [k, true])
    );
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSubmit(form);
    }
  };

  const field = (
    label: string,
    key: keyof ExpenseFormData,
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

  const inputClass = (key: keyof ExpenseFormData) =>
    `w-full px-3 py-2.5 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-violet-500/30 ${
      errors[key] && touched[key]
        ? "border-red-300 bg-red-50 focus:border-red-400"
        : "border-gray-300 bg-white focus:border-violet-400"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {field(
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

      {field(
        "Amount (₹)",
        "amount",
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            ₹
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            onBlur={() => blur("amount")}
            className={`${inputClass("amount")} pl-7`}
          />
        </div>
      )}

      {field(
        "Category",
        "category",
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const selected = form.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => set("category", cat)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  selected
                    ? `${config.bgColor} ${config.textColor} border-current ring-2 ring-current/30`
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{config.icon}</span>
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {field(
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
          {isSubmitting
            ? "Saving..."
            : initialData
            ? "Update Expense"
            : "Add Expense"}
        </button>
      </div>
    </form>
  );
}

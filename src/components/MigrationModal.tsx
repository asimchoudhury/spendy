"use client";

import { useState, useEffect } from "react";
import { Database, ArrowDownToLine } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Expense, CategoryData } from "@/types/expense";

const MIGRATED_KEY = "has_migrated";

function expenseToRow(e: Expense, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    amount: e.amount,
    category: e.category,
    subcategory: e.subcategory,
    description: e.description,
    date: e.date,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

function categoryToRow(c: CategoryData, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    color: c.color,
    bg_color: c.bgColor,
    text_color: c.textColor,
    icon: c.icon,
    subcategories: c.subcategories,
  };
}

export function MigrationModal() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);
  const [localCategories, setLocalCategories] = useState<CategoryData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!user) return;
      if (localStorage.getItem(MIGRATED_KEY)) return;

      try {
        const raw = localStorage.getItem("expenses");
        const rawCats = localStorage.getItem("categories");
        const expenses: Expense[] = raw ? JSON.parse(raw) : [];
        const categories: CategoryData[] = rawCats ? JSON.parse(rawCats) : [];

        if (expenses.length > 0) {
          setLocalExpenses(expenses);
          setLocalCategories(categories);
          setShow(true);
        } else {
          localStorage.setItem(MIGRATED_KEY, "1");
        }
      } catch {
        localStorage.setItem(MIGRATED_KEY, "1");
      }
    }

    check();
  }, [user]);

  const handleImport = async () => {
    setIsProcessing(true);
    setError(null);

    if (localCategories.length > 0) {
      const rows = localCategories.map((c) => categoryToRow(c, user!.id));
      const { error: catErr } = await supabase
        .from("categories")
        .upsert(rows, { onConflict: "id" });
      if (catErr) {
        setError(catErr.message);
        setIsProcessing(false);
        return;
      }
    }

    const expRows = localExpenses.map((e) => expenseToRow(e, user!.id));
    const { error: expErr } = await supabase
      .from("expenses")
      .upsert(expRows, { onConflict: "id" });
    if (expErr) {
      setError(expErr.message);
      setIsProcessing(false);
      return;
    }

    localStorage.removeItem("expenses");
    localStorage.removeItem("categories");
    localStorage.setItem(MIGRATED_KEY, "1");
    window.location.reload();
  };

  const handleSkip = () => {
    localStorage.setItem(MIGRATED_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <Database size={20} className="text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Import Your Existing Data
            </h2>
          </div>

          <p className="text-gray-600 mb-1">
            We found{" "}
            <span className="font-semibold text-gray-900">
              {localExpenses.length} expense{localExpenses.length !== 1 ? "s" : ""}
            </span>{" "}
            saved in this browser.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Import them to your account to keep your history, or skip to start
            fresh.
            {localCategories.length > 0 &&
              ` Your ${localCategories.length} custom categor${localCategories.length !== 1 ? "ies" : "y"} will also be imported.`}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowDownToLine size={16} />
              {isProcessing ? "Importing…" : "Import Data"}
            </button>
            <button
              onClick={handleSkip}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              Skip, start fresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef } from "react";
import { CategoryData, Subcategory } from "@/types/expense";
import { useLocalStorage } from "./useLocalStorage";
import { DEFAULT_CATEGORIES, getNextColor, suggestIconForCategory } from "@/utils/categories";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useCategories() {
  const [categories, setCategories, isLoaded] = useLocalStorage<CategoryData[]>(
    "categories",
    []
  );

  const initialized = useRef(false);

  useEffect(() => {
    if (!isLoaded || initialized.current) return;
    initialized.current = true;
    if (categories.length === 0) {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, [isLoaded, categories.length, setCategories]);

  const addCategory = useCallback(
    (name: string, icon?: string): CategoryData => {
      const palette = getNextColor(categories.length);
      const newCat: CategoryData = {
        id: generateId(),
        name: name.trim(),
        ...palette,
        icon: icon ?? suggestIconForCategory(name),
        subcategories: [{ id: generateId(), name: "General" }],
      };
      setCategories((prev) => [...prev, newCat]);
      return newCat;
    },
    [categories.length, setCategories]
  );

  const updateCategory = useCallback(
    (id: string, name: string, icon?: string): void => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, name: name.trim(), ...(icon !== undefined ? { icon } : {}) }
            : c
        )
      );
    },
    [setCategories]
  );

  const deleteCategory = useCallback(
    (id: string): void => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    },
    [setCategories]
  );

  const addSubcategory = useCallback(
    (categoryId: string, name: string): Subcategory => {
      const sub: Subcategory = { id: generateId(), name: name.trim() };
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, subcategories: [...c.subcategories, sub] }
            : c
        )
      );
      return sub;
    },
    [setCategories]
  );

  const updateSubcategory = useCallback(
    (categoryId: string, subcategoryId: string, name: string): void => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subcategories: c.subcategories.map((s) =>
                  s.id === subcategoryId ? { ...s, name: name.trim() } : s
                ),
              }
            : c
        )
      );
    },
    [setCategories]
  );

  const deleteSubcategory = useCallback(
    (categoryId: string, subcategoryId: string): void => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? {
                ...c,
                subcategories: c.subcategories.filter((s) => s.id !== subcategoryId),
              }
            : c
        )
      );
    },
    [setCategories]
  );

  const getSubcategories = useCallback(
    (categoryName: string): Subcategory[] => {
      const cat = categories.find((c) => c.name === categoryName);
      return cat?.subcategories ?? [];
    },
    [categories]
  );

  return {
    categories,
    isLoaded,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getSubcategories,
  };
}

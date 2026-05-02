"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useExpenses } from "@/hooks/useExpenses";
import { CategoryData, Subcategory } from "@/types/expense";
import { Modal } from "@/components/ui/Modal";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import {
  validateCategoryName,
  validateSubcategoryName,
  suggestIconForCategory,
  DEFAULT_CATEGORIES,
} from "@/utils/categories";
import { IconPicker } from "@/components/ui/IconPicker";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";

// ─── Inline form component ────────────────────────────────────────────────────

function NameInput({
  value,
  onChange,
  error,
  placeholder,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder: string;
  onBlur?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-violet-500/30 transition-colors ${
          error
            ? "border-red-300 bg-red-50 focus:border-red-400"
            : "border-gray-300 bg-white focus:border-violet-400"
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Category page ─────────────────────────────────────────────────────────

type ModalMode =
  | { type: "add-category" }
  | { type: "edit-category"; category: CategoryData }
  | { type: "delete-category"; category: CategoryData }
  | { type: "add-subcategory"; category: CategoryData }
  | { type: "edit-subcategory"; category: CategoryData; subcategory: Subcategory }
  | { type: "delete-subcategory"; category: CategoryData; subcategory: Subcategory };

export default function CategoriesPage() {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
  } = useCategories();
  const { bulkMigrateCategory, bulkMigrateSubcategory, bulkRenameCategory, bulkRenameSubcategory } =
    useExpenses();
  const { toasts, addToast, dismiss } = useToast();

  const [modal, setModal] = useState<ModalMode | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [touched, setTouched] = useState(false);
  const [iconInput, setIconInput] = useState("📁");
  const [autoSuggestIcon, setAutoSuggestIcon] = useState(false);

  const openModal = (m: ModalMode) => {
    setModal(m);
    if (m.type === "edit-category") {
      setNameInput(m.category.name);
      setIconInput(m.category.icon);
      setAutoSuggestIcon(false);
    } else if (m.type === "edit-subcategory") {
      setNameInput(m.subcategory.name);
    } else if (m.type === "add-category") {
      setNameInput("");
      setIconInput("📁");
      setAutoSuggestIcon(true);
    } else {
      setNameInput("");
    }
    setNameError("");
    setTouched(false);
  };

  const closeModal = () => {
    setModal(null);
    setNameInput("");
    setNameError("");
    setTouched(false);
    setIconInput("📁");
    setAutoSuggestIcon(false);
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Validation helpers ─────────────────────────────────────────────

  const validateName = (value: string): string => {
    if (!modal) return "";
    if (modal.type === "add-category" || modal.type === "edit-category") {
      const existing = categories.map((c) => c.name);
      const current = modal.type === "edit-category" ? modal.category.name : undefined;
      return validateCategoryName(value, existing, current) ?? "";
    }
    if (modal.type === "add-subcategory" || modal.type === "edit-subcategory") {
      const existing = modal.category.subcategories.map((s) => s.name);
      const current =
        modal.type === "edit-subcategory" ? modal.subcategory.name : undefined;
      return validateSubcategoryName(value, existing, current) ?? "";
    }
    return "";
  };

  const handleNameChange = (v: string) => {
    setNameInput(v);
    if (autoSuggestIcon) {
      setIconInput(suggestIconForCategory(v) || "📁");
    }
    if (touched) setNameError(validateName(v));
  };

  const handleIconSelect = (icon: string) => {
    setIconInput(icon);
    setAutoSuggestIcon(false);
  };

  const handleNameBlur = () => {
    setTouched(true);
    setNameError(validateName(nameInput));
  };

  // ── Submit handlers ────────────────────────────────────────────────

  const handleSubmit = () => {
    setTouched(true);
    const err = validateName(nameInput);
    setNameError(err);
    if (err || !modal) return;

    if (modal.type === "add-category") {
      addCategory(nameInput, iconInput);
      addToast("success", `Category "${nameInput.trim()}" added`);
      closeModal();
    } else if (modal.type === "edit-category") {
      const oldName = modal.category.name;
      const newName = nameInput.trim();
      updateCategory(modal.category.id, newName, iconInput);
      bulkRenameCategory(oldName, newName);
      addToast("success", `Category renamed to "${newName}"`);
      closeModal();
    } else if (modal.type === "add-subcategory") {
      addSubcategory(modal.category.id, nameInput);
      addToast("success", `Subcategory "${nameInput.trim()}" added`);
      closeModal();
    } else if (modal.type === "edit-subcategory") {
      const oldName = modal.subcategory.name;
      const newName = nameInput.trim();
      updateSubcategory(modal.category.id, modal.subcategory.id, newName);
      bulkRenameSubcategory(modal.category.name, oldName, newName);
      addToast("success", `Subcategory renamed to "${newName}"`);
      closeModal();
    }
  };

  const handleDeleteCategory = () => {
    if (modal?.type !== "delete-category") return;
    const cat = modal.category;
    const fallback = categories.find((c) => c.id !== cat.id) ?? DEFAULT_CATEGORIES[5];
    bulkMigrateCategory(cat.name, fallback.name, "General");
    deleteCategory(cat.id);
    addToast("success", `Category "${cat.name}" deleted. Expenses moved to "${fallback.name}".`);
    closeModal();
  };

  const handleDeleteSubcategory = () => {
    if (modal?.type !== "delete-subcategory") return;
    const { category, subcategory } = modal;
    bulkMigrateSubcategory(category.name, subcategory.name, "General");
    deleteSubcategory(category.id, subcategory.id);
    addToast("success", `Subcategory "${subcategory.name}" deleted. Expenses moved to "General".`);
    closeModal();
  };

  // ── Modal title and content ────────────────────────────────────────

  const getModalTitle = () => {
    if (!modal) return "";
    switch (modal.type) {
      case "add-category": return "Add Category";
      case "edit-category": return "Edit Category";
      case "delete-category": return "Delete Category";
      case "add-subcategory": return `Add Subcategory — ${modal.category.name}`;
      case "edit-subcategory": return `Edit Subcategory`;
      case "delete-subcategory": return "Delete Subcategory";
    }
  };

  const isNameModal =
    modal?.type === "add-category" ||
    modal?.type === "edit-category" ||
    modal?.type === "add-subcategory" ||
    modal?.type === "edit-subcategory";

  const isDeleteModal =
    modal?.type === "delete-category" || modal?.type === "delete-subcategory";

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your spending categories and subcategories
            </p>
          </div>
          <button
            onClick={() => openModal({ type: "add-category" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Category</span>
          </button>
        </div>

        {/* Category list */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl">
              📁
            </div>
            <p className="text-gray-600 font-medium">No categories yet</p>
            <p className="text-gray-400 text-sm">
              Add a category to start organising your expenses
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {categories.map((cat) => {
              const isOpen = expanded[cat.id] !== false; // default open
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                >
                  {/* Category row */}
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${cat.bgColor}`}
                      >
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-400">
                          {cat.subcategories.length} subcategor{cat.subcategories.length !== 1 ? "ies" : "y"}
                        </p>
                      </div>
                      {isOpen ? (
                        <ChevronDown size={16} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400 shrink-0" />
                      )}
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openModal({ type: "edit-category", category: cat })}
                        className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                        title="Rename category"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => openModal({ type: "delete-category", category: cat })}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategory list */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
                      {cat.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-3 pl-3 py-1.5 rounded-lg hover:bg-gray-50 group"
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm text-gray-700 flex-1">{sub.name}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                openModal({
                                  type: "edit-subcategory",
                                  category: cat,
                                  subcategory: sub,
                                })
                              }
                              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                              title="Rename subcategory"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() =>
                                openModal({
                                  type: "delete-subcategory",
                                  category: cat,
                                  subcategory: sub,
                                })
                              }
                              disabled={cat.subcategories.length <= 1}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                cat.subcategories.length <= 1
                                  ? "Cannot delete the only subcategory"
                                  : "Delete subcategory"
                              }
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          openModal({ type: "add-subcategory", category: cat })
                        }
                        className="flex items-center gap-2 text-xs text-violet-600 hover:text-violet-700 font-medium px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors mt-1 w-fit"
                      >
                        <Plus size={13} />
                        Add subcategory
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Name modal (add/edit category or subcategory) */}
      <Modal isOpen={!!modal && isNameModal} onClose={closeModal} title={getModalTitle()}>
        <div className="flex flex-col gap-4">
          <NameInput
            value={nameInput}
            onChange={handleNameChange}
            error={nameError}
            placeholder="Enter name..."
            onBlur={handleNameBlur}
          />

          {(modal?.type === "add-category" || modal?.type === "edit-category") && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">Icon</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{iconInput}</span>
                  {autoSuggestIcon && nameInput.trim() && (
                    <span className="text-[10px] text-violet-500 font-medium">auto-suggested</span>
                  )}
                </div>
              </div>
              <IconPicker selected={iconInput} onSelect={handleIconSelect} />
            </div>
          )}

          <p className="text-xs text-gray-400">
            2–50 characters. Letters, numbers, spaces and &amp; - _ ( ) &apos; are allowed.
          </p>
          <div className="flex gap-3 pt-1">
            <button
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              {modal?.type === "add-category" || modal?.type === "add-subcategory"
                ? "Add"
                : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete category modal */}
      <Modal
        isOpen={modal?.type === "delete-category"}
        onClose={closeModal}
        title="Delete Category"
      >
        {modal?.type === "delete-category" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Delete &quot;{modal.category.name}&quot;?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All expenses in this category will be moved to another category.
                  This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete subcategory modal */}
      <Modal
        isOpen={modal?.type === "delete-subcategory"}
        onClose={closeModal}
        title="Delete Subcategory"
      >
        {modal?.type === "delete-subcategory" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Delete &quot;{modal.subcategory.name}&quot;?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All expenses in this subcategory will be moved to &quot;General&quot;
                  within {modal.category.name}. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubcategory}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}

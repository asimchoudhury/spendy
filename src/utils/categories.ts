import { Category } from "@/types/expense";

export const CATEGORIES: Category[] = [
  "Food",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
];

export const CATEGORY_CONFIG: Record<
  Category,
  { color: string; bgColor: string; textColor: string; icon: string }
> = {
  Food: {
    color: "#f97316",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    icon: "🍽️",
  },
  Transportation: {
    color: "#3b82f6",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    icon: "🚗",
  },
  Entertainment: {
    color: "#a855f7",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
    icon: "🎬",
  },
  Shopping: {
    color: "#ec4899",
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
    icon: "🛍️",
  },
  Bills: {
    color: "#ef4444",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    icon: "📄",
  },
  Other: {
    color: "#6b7280",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    icon: "📦",
  },
};

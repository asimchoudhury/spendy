import { CategoryData } from "@/types/expense";

export const ICON_KEYWORDS: Array<{ icon: string; keywords: string[] }> = [
  { icon: "🛒", keywords: ["groceries", "supermarket", "grocery"] },
  { icon: "🍽️", keywords: ["food", "dining", "restaurant", "eating"] },
  { icon: "👕", keywords: ["clothing", "apparel", "fashion", "clothes"] },
  { icon: "💊", keywords: ["health", "medicine", "medical", "pharmacy"] },
  { icon: "🏃", keywords: ["fitness", "sports", "exercise"] },
  { icon: "✏️", keywords: ["stationery", "office", "school", "study"] },
  { icon: "🚗", keywords: ["transport", "fuel", "car", "vehicle"] },
  { icon: "💡", keywords: ["utilities", "bills", "electricity", "water"] },
  { icon: "🎮", keywords: ["entertainment", "gaming", "fun", "leisure"] },
  { icon: "✈️", keywords: ["travel", "holiday", "vacation", "trip", "flight"] },
  { icon: "📱", keywords: ["mobile", "phone", "technology", "gadgets", "tech"] },
  { icon: "🏠", keywords: ["home", "house", "rent", "maintenance"] },
  { icon: "🎵", keywords: ["music", "concerts", "events"] },
  { icon: "☕", keywords: ["coffee", "cafe", "snacks", "beverages"] },
  { icon: "🐾", keywords: ["pets", "animals", "vet"] },
  { icon: "📚", keywords: ["books", "education", "learning"] },
  { icon: "💰", keywords: ["savings", "investment", "finance"] },
  { icon: "🎁", keywords: ["gifts", "shopping", "presents"] },
  { icon: "🏋️", keywords: ["gym", "workout"] },
  { icon: "🌿", keywords: ["nature", "garden", "outdoor"] },
  { icon: "🏔️", keywords: ["mountains", "trekking", "hiking", "adventure", "altitude", "peaks", "snow"] },
  { icon: "🌲", keywords: ["forest", "trees", "pine", "woods", "camping"] },
  { icon: "🏪", keywords: ["shop", "local", "kirana", "convenience", "neighbourhood"] },
  { icon: "🌱", keywords: ["organic", "eco", "sustainable", "vegan"] },
  { icon: "🧘‍♂️", keywords: ["meditation", "yoga", "mindfulness", "wellness", "spiritual", "calm"] },
  { icon: "🧘‍♀️", keywords: ["meditation", "yoga", "mindfulness", "wellness", "spiritual", "peace", "women"] },
  { icon: "🌊", keywords: ["ocean", "sea", "beach", "waves", "swimming", "surf", "coastal"] },
  { icon: "☀️", keywords: ["sun", "solar", "summer", "energy", "morning", "daylight", "sunshine"] },
  { icon: "🌙", keywords: ["moon", "night", "evening", "lunar", "sleep", "nighttime", "stars"] },
];

export function suggestIconForCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const { icon, keywords } of ICON_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return icon;
  }
  return "📁";
}

const COLOR_PALETTE: Array<{ color: string; bgColor: string; textColor: string }> = [
  { color: "#f97316", bgColor: "bg-orange-100", textColor: "text-orange-700" },
  { color: "#3b82f6", bgColor: "bg-blue-100", textColor: "text-blue-700" },
  { color: "#a855f7", bgColor: "bg-purple-100", textColor: "text-purple-700" },
  { color: "#ec4899", bgColor: "bg-pink-100", textColor: "text-pink-700" },
  { color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-700" },
  { color: "#6b7280", bgColor: "bg-gray-100", textColor: "text-gray-700" },
  { color: "#10b981", bgColor: "bg-emerald-100", textColor: "text-emerald-700" },
  { color: "#f59e0b", bgColor: "bg-amber-100", textColor: "text-amber-700" },
  { color: "#06b6d4", bgColor: "bg-cyan-100", textColor: "text-cyan-700" },
  { color: "#84cc16", bgColor: "bg-lime-100", textColor: "text-lime-700" },
];

export function getNextColor(count: number) {
  return COLOR_PALETTE[count % COLOR_PALETTE.length];
}

export const DEFAULT_CATEGORIES: CategoryData[] = [
  {
    id: "food",
    name: "Food",
    color: "#f97316",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    icon: "🍽️",
    subcategories: [{ id: "food-general", name: "General" }],
  },
  {
    id: "transportation",
    name: "Transportation",
    color: "#3b82f6",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    icon: "🚗",
    subcategories: [{ id: "transportation-general", name: "General" }],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    color: "#a855f7",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
    icon: "🎬",
    subcategories: [{ id: "entertainment-general", name: "General" }],
  },
  {
    id: "shopping",
    name: "Shopping",
    color: "#ec4899",
    bgColor: "bg-pink-100",
    textColor: "text-pink-700",
    icon: "🛍️",
    subcategories: [{ id: "shopping-general", name: "General" }],
  },
  {
    id: "bills",
    name: "Bills",
    color: "#ef4444",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    icon: "📄",
    subcategories: [{ id: "bills-general", name: "General" }],
  },
  {
    id: "other",
    name: "Other",
    color: "#6b7280",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    icon: "📦",
    subcategories: [{ id: "other-general", name: "General" }],
  },
];

// Static fallback config for the default categories
export const CATEGORY_CONFIG: Record<
  string,
  { color: string; bgColor: string; textColor: string; icon: string }
> = {
  Food: { color: "#f97316", bgColor: "bg-orange-100", textColor: "text-orange-700", icon: "🍽️" },
  Transportation: { color: "#3b82f6", bgColor: "bg-blue-100", textColor: "text-blue-700", icon: "🚗" },
  Entertainment: { color: "#a855f7", bgColor: "bg-purple-100", textColor: "text-purple-700", icon: "🎬" },
  Shopping: { color: "#ec4899", bgColor: "bg-pink-100", textColor: "text-pink-700", icon: "🛍️" },
  Bills: { color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-700", icon: "📄" },
  Other: { color: "#6b7280", bgColor: "bg-gray-100", textColor: "text-gray-700", icon: "📦" },
};

const FALLBACK_CONFIG = {
  color: "#6b7280",
  bgColor: "bg-gray-100",
  textColor: "text-gray-700",
  icon: "📁",
};

export function getCategoryConfig(
  name: string,
  categories?: CategoryData[]
): { color: string; bgColor: string; textColor: string; icon: string } {
  if (categories) {
    const cat = categories.find((c) => c.name === name);
    if (cat) return { color: cat.color, bgColor: cat.bgColor, textColor: cat.textColor, icon: cat.icon };
  }
  return CATEGORY_CONFIG[name] ?? FALLBACK_CONFIG;
}

const NAME_REGEX = /^[a-zA-Z0-9 &\-_()']+$/;

export function validateCategoryName(
  name: string,
  existingNames: string[],
  currentName?: string
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name cannot be empty";
  if (trimmed.length < 2) return "Name must be at least 2 characters";
  if (trimmed.length > 50) return "Name must be at most 50 characters";
  if (!/[a-zA-Z]/.test(trimmed)) return "Name must contain at least one letter";
  if (!NAME_REGEX.test(trimmed)) return "Only letters, numbers, spaces and & - _ ( ) ' are allowed";
  const lower = trimmed.toLowerCase();
  const duplicate = existingNames.some(
    (n) =>
      n.toLowerCase() === lower &&
      (!currentName || n.toLowerCase() !== currentName.toLowerCase())
  );
  if (duplicate) return "A category with this name already exists";
  return null;
}

export function validateSubcategoryName(
  name: string,
  existingNames: string[],
  currentName?: string
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name cannot be empty";
  if (trimmed.length < 2) return "Name must be at least 2 characters";
  if (trimmed.length > 50) return "Name must be at most 50 characters";
  if (!/[a-zA-Z]/.test(trimmed)) return "Name must contain at least one letter";
  if (!NAME_REGEX.test(trimmed)) return "Only letters, numbers, spaces and & - _ ( ) ' are allowed";
  const lower = trimmed.toLowerCase();
  const duplicate = existingNames.some(
    (n) =>
      n.toLowerCase() === lower &&
      (!currentName || n.toLowerCase() !== currentName.toLowerCase())
  );
  if (duplicate) return "A subcategory with this name already exists";
  return null;
}

import { getCategoryConfig } from "@/utils/categories";
import { CategoryData } from "@/types/expense";

interface BadgeProps {
  category: string;
  categories?: CategoryData[];
  showIcon?: boolean;
}

export function CategoryBadge({ category, categories, showIcon = true }: BadgeProps) {
  const config = getCategoryConfig(category, categories);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {showIcon && <span>{config.icon}</span>}
      {category}
    </span>
  );
}

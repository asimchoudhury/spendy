import { CATEGORY_CONFIG } from "@/utils/categories";
import { Category } from "@/types/expense";

interface BadgeProps {
  category: Category;
  showIcon?: boolean;
}

export function CategoryBadge({ category, showIcon = true }: BadgeProps) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {showIcon && <span>{config.icon}</span>}
      {category}
    </span>
  );
}

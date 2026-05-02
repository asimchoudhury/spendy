"use client";

import { ICON_KEYWORDS } from "@/utils/categories";

const PICKER_ICONS = [...ICON_KEYWORDS.map((e) => e.icon), "📁"];

interface IconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
}

export function IconPicker({ selected, onSelect }: IconPickerProps) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {PICKER_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onSelect(icon)}
          title={icon}
          className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all hover:scale-110 ${
            selected === icon
              ? "bg-violet-100 ring-2 ring-violet-500 scale-110"
              : "hover:bg-gray-100"
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

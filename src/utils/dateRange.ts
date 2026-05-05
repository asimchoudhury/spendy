import { format, subMonths, subYears } from "date-fns";

export type TimeRange = "all" | "1y" | "6m" | "3m";

export const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "All", value: "all" },
  { label: "1 Yr", value: "1y" },
  { label: "6 Mo", value: "6m" },
  { label: "3 Mo", value: "3m" },
];

export function getStartDateStr(range: TimeRange): string | null {
  const now = new Date();
  if (range === "1y") return format(subYears(now, 1), "yyyy-MM-dd");
  if (range === "6m") return format(subMonths(now, 6), "yyyy-MM-dd");
  if (range === "3m") return format(subMonths(now, 3), "yyyy-MM-dd");
  return null;
}

export function getDateRangeLabel(range: TimeRange): string {
  if (range === "all") return "All time";
  const now = new Date();
  const start =
    range === "1y" ? subYears(now, 1) :
    range === "6m" ? subMonths(now, 6) :
    subMonths(now, 3);
  return `${format(start, "MMM yyyy")} — ${format(now, "MMM yyyy")}`;
}

export function filterByRange<T extends { date: string }>(items: T[], range: TimeRange): T[] {
  const startDate = getStartDateStr(range);
  if (!startDate) return items;
  return items.filter((item) => item.date >= startDate);
}

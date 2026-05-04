import { Expense } from "@/types/expense";
import { formatCurrency } from "./currency";

function csvRow(fields: string[]): string {
  return fields
    .map((f) => (f.includes(",") || f.includes('"') || f.includes("\n") ? `"${f.replace(/"/g, '""')}"` : f))
    .join(",");
}

export function generateTaxReportCSV(expenses: Expense[]): string {
  const byCategory: Record<string, { total: number; items: Expense[] }> = {};
  for (const e of expenses) {
    if (!byCategory[e.category])
      byCategory[e.category] = { total: 0, items: [] };
    byCategory[e.category].total += e.amount;
    byCategory[e.category].items.push(e);
  }
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const lines: string[] = [
    `TAX REPORT - EXPENSE SUMMARY`,
    `Generated: ${new Date().toLocaleDateString("en-IN")}`,
    `Total Transactions: ${expenses.length}`,
    `Grand Total: ${formatCurrency(grandTotal)}`,
    "",
    "CATEGORY BREAKDOWN",
    csvRow(["Category", "Total Amount", "Transactions", "% of Total"]),
  ];
  for (const [cat, data] of Object.entries(byCategory).sort(
    (a, b) => b[1].total - a[1].total
  )) {
    const pct =
      grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : "0.0";
    lines.push(
      csvRow([cat, formatCurrency(data.total), String(data.items.length), `${pct}%`])
    );
  }
  lines.push("", "DETAILED TRANSACTIONS");
  lines.push(
    csvRow(["Date", "Description", "Category", "Subcategory", "Amount"])
  );
  for (const e of [...expenses].sort((a, b) =>
    a.date.localeCompare(b.date)
  )) {
    lines.push(
      csvRow([
        e.date,
        e.description,
        e.category,
        e.subcategory || "General",
        formatCurrency(e.amount),
      ])
    );
  }
  return lines.join("\n");
}

export function generateMonthlySummaryCSV(expenses: Expense[]): string {
  const byMonth: Record<string, { total: number; count: number }> = {};
  for (const e of expenses) {
    const m = e.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { total: 0, count: 0 };
    byMonth[m].total += e.amount;
    byMonth[m].count++;
  }
  const lines: string[] = [
    "MONTHLY SPENDING SUMMARY",
    `Generated: ${new Date().toLocaleDateString("en-IN")}`,
    "",
    csvRow(["Month", "Total Spending", "Transactions", "Avg per Transaction"]),
  ];
  for (const [month, data] of Object.entries(byMonth).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const [year, mo] = month.split("-");
    const label = new Date(parseInt(year), parseInt(mo) - 1).toLocaleString(
      "en-IN",
      { month: "long", year: "numeric" }
    );
    const avg = data.count > 0 ? data.total / data.count : 0;
    lines.push(
      csvRow([label, formatCurrency(data.total), String(data.count), formatCurrency(avg)])
    );
  }
  return lines.join("\n");
}

export function generateCategoryAnalysisCSV(expenses: Expense[]): string {
  const byCategory: Record<
    string,
    Record<string, { total: number; count: number }>
  > = {};
  for (const e of expenses) {
    if (!byCategory[e.category]) byCategory[e.category] = {};
    const sub = e.subcategory || "General";
    if (!byCategory[e.category][sub])
      byCategory[e.category][sub] = { total: 0, count: 0 };
    byCategory[e.category][sub].total += e.amount;
    byCategory[e.category][sub].count++;
  }
  const lines: string[] = [
    "CATEGORY ANALYSIS REPORT",
    `Generated: ${new Date().toLocaleDateString("en-IN")}`,
    "",
  ];
  for (const [cat, subs] of Object.entries(byCategory)) {
    const catTotal = Object.values(subs).reduce((s, v) => s + v.total, 0);
    const catCount = Object.values(subs).reduce((s, v) => s + v.count, 0);
    lines.push(`--- ${cat} ---`);
    lines.push(`Total: ${formatCurrency(catTotal)} | ${catCount} transactions`);
    lines.push(csvRow(["Subcategory", "Total", "Transactions"]));
    for (const [sub, data] of Object.entries(subs)) {
      lines.push(csvRow([sub, formatCurrency(data.total), String(data.count)]));
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function generateLedgerCSV(expenses: Expense[]): string {
  const headers = csvRow([
    "ID",
    "Date",
    "Description",
    "Category",
    "Subcategory",
    "Amount",
    "Created At",
  ]);
  const rows = [...expenses]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) =>
      csvRow([
        e.id,
        e.date,
        e.description,
        e.category,
        e.subcategory || "General",
        formatCurrency(e.amount),
        new Date(e.createdAt).toLocaleDateString("en-IN"),
      ])
    );
  return [headers, ...rows].join("\n");
}

export function generateInsightsJSON(expenses: Expense[]): string {
  const byCategory: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    const m = e.date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + e.amount;
  }
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const monthlyValues = Object.values(byMonth);
  const avgMonthly =
    monthlyValues.length > 0
      ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
      : 0;
  const topCategory = Object.entries(byCategory).sort(
    ([, a], [, b]) => b - a
  )[0];
  const insights = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalTransactions: expenses.length,
      totalSpending: total,
      averageMonthlySpending: avgMonthly,
      topCategory: topCategory ? topCategory[0] : null,
      topCategoryAmount: topCategory ? topCategory[1] : 0,
      uniqueCategories: Object.keys(byCategory).length,
    },
    byCategory,
    byMonth,
    recentTrend:
      monthlyValues.length >= 2
        ? monthlyValues[monthlyValues.length - 1] >
          monthlyValues[monthlyValues.length - 2]
          ? "increasing"
          : "decreasing"
        : "insufficient_data",
  };
  return JSON.stringify(insights, null, 2);
}

export function triggerDownload(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import { Expense } from "@/types/expense";
import { formatCurrency } from "./currency";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCSV(expenses: Expense[], filename: string): void {
  const headers = ["Date", "Description", "Category", "Subcategory", "Amount (INR)"];
  const rows = expenses.map((e) => [
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    `"${e.category}"`,
    `"${e.subcategory || "General"}"`,
    e.amount.toFixed(2),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  // BOM for Excel UTF-8 compatibility
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const name = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  downloadBlob(blob, name);
}

export function exportJSON(expenses: Expense[], filename: string): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const categoryBreakdown = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const payload = {
    generatedBy: "Spendy",
    exportedAt: new Date().toISOString(),
    summary: {
      count: expenses.length,
      totalAmount: parseFloat(total.toFixed(2)),
      categories: Object.keys(categoryBreakdown).sort(),
      categoryBreakdown: Object.fromEntries(
        Object.entries(categoryBreakdown)
          .sort(([, a], [, b]) => b - a)
          .map(([k, v]) => [k, parseFloat(v.toFixed(2))])
      ),
    },
    expenses: expenses.map((e) => ({
      id: e.id,
      date: e.date,
      description: e.description,
      category: e.category,
      subcategory: e.subcategory || "General",
      amount: e.amount,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const name = filename.endsWith(".json") ? filename : `${filename}.json`;
  downloadBlob(blob, name);
}

export function exportPDF(expenses: Expense[], filename: string): void {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const dateMin = expenses.reduce((m, e) => (e.date < m ? e.date : m), expenses[0]?.date ?? "");
  const dateMax = expenses.reduce((m, e) => (e.date > m ? e.date : m), expenses[0]?.date ?? "");

  const detailRows = expenses
    .map(
      (e, i) => `
      <tr class="${i % 2 === 0 ? "" : "alt"}">
        <td class="mono">${e.date}</td>
        <td>${e.description}</td>
        <td><span class="cat-badge">${e.category}</span></td>
        <td class="sub">${e.subcategory || "General"}</td>
        <td class="amount">${formatCurrency(e.amount)}</td>
      </tr>`
    )
    .join("");

  const categoryRows = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([cat, amt], i) => `
      <tr class="${i % 2 === 0 ? "" : "alt"}">
        <td>${cat}</td>
        <td class="amount">${formatCurrency(amt)}</td>
        <td class="pct">${((amt / total) * 100).toFixed(1)}%</td>
      </tr>`
    )
    .join("");

  const generatedOn = new Date().toLocaleDateString("en-IN", {
    dateStyle: "long",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${filename} — Spendy Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      color: #111827;
      background: white;
      padding: 40px 48px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header { margin-bottom: 32px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
    .header-top { display: flex; align-items: flex-start; justify-content: space-between; }
    .app-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #7c3aed; }
    .report-title { font-size: 24px; font-weight: 700; color: #111827; margin-top: 4px; }
    .report-meta { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .header-right { text-align: right; }
    .generated { font-size: 10px; color: #9ca3af; }
    .filename { font-size: 11px; color: #6b7280; font-family: monospace; margin-top: 2px; }

    .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
    .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
    .kpi .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; }
    .kpi .value { font-size: 20px; font-weight: 800; color: #111827; margin-top: 4px; line-height: 1; }
    .kpi.accent { background: linear-gradient(135deg, #ede9fe, #ddd6fe); border-color: #c4b5fd; }
    .kpi.accent .value { color: #5b21b6; }

    h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; margin-bottom: 12px; }
    .section { margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; }
    th {
      background: #f3f4f6;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6b7280;
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    td { padding: 7px 10px; font-size: 11px; color: #374151; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    tr.alt td { background: #fafafa; }
    tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: 700; color: #111827; background: #f3f4f6; border-top: 2px solid #e5e7eb; font-size: 12px; }
    .amount { text-align: right; font-family: "SF Mono", "Fira Code", monospace; }
    .pct { text-align: right; color: #9ca3af; }
    .mono { font-family: "SF Mono", "Fira Code", monospace; color: #6b7280; }
    .sub { color: #9ca3af; }
    .cat-badge {
      display: inline-block;
      background: #ede9fe;
      color: #5b21b6;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 10px;
      font-weight: 600;
    }
    .breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
    }

    @media print {
      body { padding: 0; }
      @page { margin: 15mm 15mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div>
        <div class="app-name">Spendy</div>
        <div class="report-title">Expense Report</div>
        <div class="report-meta">${dateMin === dateMax ? dateMin : `${dateMin} — ${dateMax}`} &nbsp;·&nbsp; ${expenses.length} record${expenses.length !== 1 ? "s" : ""}</div>
      </div>
      <div class="header-right">
        <div class="generated">Generated on ${generatedOn}</div>
        <div class="filename">${filename}</div>
      </div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi accent">
      <div class="label">Total Spent</div>
      <div class="value">${formatCurrency(total)}</div>
    </div>
    <div class="kpi">
      <div class="label">Transactions</div>
      <div class="value">${expenses.length}</div>
    </div>
    <div class="kpi">
      <div class="label">Categories</div>
      <div class="value">${Object.keys(byCategory).length}</div>
    </div>
    <div class="kpi">
      <div class="label">Avg per Record</div>
      <div class="value" style="font-size:15px">${formatCurrency(expenses.length ? total / expenses.length : 0)}</div>
    </div>
  </div>

  <div class="section">
    <h2>Expense Details</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Category</th>
          <th>Subcategory</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${detailRows}
        <tr class="total-row">
          <td colspan="4">Total</td>
          <td class="amount">${formatCurrency(total)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Category Breakdown</h2>
    <div class="breakdown-grid">
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th class="amount">Amount</th>
            <th class="pct">Share</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRows}
          <tr class="total-row">
            <td>Total</td>
            <td class="amount">${formatCurrency(total)}</td>
            <td class="pct">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    <span>Spendy — Personal Expense Tracker</span>
    <span>Confidential · ${generatedOn}</span>
  </div>

  <script>
    window.addEventListener('load', function() {
      window.print();
    });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Please allow pop-ups to export as PDF.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

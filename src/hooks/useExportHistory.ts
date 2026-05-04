"use client";

import { useLocalStorage } from "./useLocalStorage";

export type ExportFormat = "csv" | "json" | "txt";
export type ExportDestination =
  | "download"
  | "email"
  | "google-sheets"
  | "dropbox"
  | "onedrive"
  | "notion";
export type ExportStatus = "completed" | "processing" | "failed";

export interface ExportRecord {
  id: string;
  timestamp: string;
  templateName: string;
  format: ExportFormat;
  destination: ExportDestination;
  status: ExportStatus;
  sizeBytes: number;
  rowCount: number;
  shareLink?: string;
}

export interface ExportSchedule {
  id: string;
  enabled: boolean;
  templateName: string;
  destination: ExportDestination;
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-28 for monthly
  hour: number;
  minute: number;
  createdAt: string;
  lastRun?: string;
  nextRun: string;
}

function computeNextRun(
  frequency: "daily" | "weekly" | "monthly",
  hour: number,
  minute: number,
  dayOfWeek?: number,
  dayOfMonth?: number
): string {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);

  if (frequency === "daily") {
    if (next <= now) next.setDate(next.getDate() + 1);
  } else if (frequency === "weekly") {
    const target = dayOfWeek ?? 1;
    let diff = target - now.getDay();
    if (diff < 0 || (diff === 0 && next <= now)) diff += 7;
    next.setDate(now.getDate() + diff);
  } else {
    const target = dayOfMonth ?? 1;
    next.setDate(target);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(target);
    }
  }

  return next.toISOString();
}

export function useExportHistory() {
  const [history, setHistory] = useLocalStorage<ExportRecord[]>(
    "export-history-v3",
    []
  );
  const [schedules, setSchedules] = useLocalStorage<ExportSchedule[]>(
    "export-schedules-v3",
    []
  );

  function addRecord(
    record: Omit<ExportRecord, "id" | "timestamp">
  ): ExportRecord {
    const newRecord: ExportRecord = {
      ...record,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => [newRecord, ...prev].slice(0, 50));
    return newRecord;
  }

  function addSchedule(
    schedule: Omit<ExportSchedule, "id" | "createdAt" | "nextRun">
  ): ExportSchedule {
    const nextRun = computeNextRun(
      schedule.frequency,
      schedule.hour,
      schedule.minute,
      schedule.dayOfWeek,
      schedule.dayOfMonth
    );
    const newSchedule: ExportSchedule = {
      ...schedule,
      id: `sch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      nextRun,
    };
    setSchedules((prev) => [...prev, newSchedule]);
    return newSchedule;
  }

  function toggleSchedule(id: string) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }

  function deleteSchedule(id: string) {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  return {
    history,
    schedules,
    addRecord,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    clearHistory,
  };
}

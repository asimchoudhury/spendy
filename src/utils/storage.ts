export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB

const SPENDY_KEYS = ["expenses", "expense-filters", "categories"];

export function getStorageUsage(): { bytes: number; percentage: number } {
  if (typeof window === "undefined") return { bytes: 0, percentage: 0 };
  let bytes = 0;
  for (const key of SPENDY_KEYS) {
    const val = localStorage.getItem(key);
    if (val) bytes += new Blob([val]).size;
  }
  return { bytes, percentage: (bytes / STORAGE_LIMIT_BYTES) * 100 };
}

export function estimatePostImportBytes(additionalJson: string): number {
  return getStorageUsage().bytes + new Blob([additionalJson]).size;
}

export function estimatePostImportPercentage(additionalJson: string): number {
  return (estimatePostImportBytes(additionalJson) / STORAGE_LIMIT_BYTES) * 100;
}

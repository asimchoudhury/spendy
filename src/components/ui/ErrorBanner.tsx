"use client";

import { isNetworkError } from "@/utils/offlineQueue";

/**
 * Inline banner for genuine (non-network) server errors surfaced by the data
 * hooks. Offline state is already communicated by the global banner, so network
 * errors are suppressed here to avoid overlapping messages. Renders nothing when
 * there is no error to show.
 */
export function ErrorBanner({ error }: { error: string | null }) {
  if (!error || isNetworkError(error)) return null;
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
      {error}
    </div>
  );
}

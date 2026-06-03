"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useDataRefresh } from "@/contexts/DataRefreshContext";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import {
  readQueue,
  removeFromQueue,
  replayEntry,
  writeQueue,
  MAX_RETRIES,
  type QueueEntry,
} from "@/utils/offlineQueue";
import { markOffline, markOnline, useOffline, probeOnline } from "@/utils/connectivity";

// How often to actively probe Supabase reachability. Browser online/offline
// events are unreliable across environments, so we don't depend on them alone.
const POLL_MS = 15000;

// Owns the app's connectivity belief and the offline expense queue. Mounted once,
// inside DataRefreshProvider, so a successful drain can triggerRefetch() to pull
// synced rows into every useExpenses instance. Renders only its own toasts.
export function OfflineSyncManager() {
  const { user } = useAuth();
  const { triggerRefetch } = useDataRefresh();
  const { toasts, addToast, dismiss } = useToast();
  const offline = useOffline();
  const draining = useRef(false);
  const wasOffline = useRef(offline);

  // Lightweight reachability probe (shared with the export/import click guard).
  const checkConnectivity = useCallback(async () => {
    if (!user) return;
    await probeOnline();
  }, [user]);

  const drain = useCallback(async () => {
    if (draining.current) return;
    if (readQueue().length === 0) return;

    draining.current = true;
    let synced = 0;
    const dropped: QueueEntry[] = [];
    try {
      // Re-read each pass so we always replay in insertion order from the
      // authoritative localStorage state.
      let queue = readQueue();
      for (let i = 0; i < queue.length; ) {
        const entry = queue[i];
        const result = await replayEntry(entry);

        if (result.ok) {
          removeFromQueue(entry.id);
          synced++;
        } else if (result.network) {
          // Still offline — stop and leave the rest queued for next time.
          markOffline();
          break;
        } else {
          // A real server rejection. Retry a few times across drains, then drop
          // it so it can't block the queue forever.
          const nextRetry = entry.retryCount + 1;
          if (nextRetry >= MAX_RETRIES) {
            removeFromQueue(entry.id);
            dropped.push(entry);
          } else {
            const current = readQueue();
            writeQueue(
              current.map((e) =>
                e.id === entry.id ? { ...e, retryCount: nextRetry } : e
              )
            );
            i++; // skip for now; revisit on a later drain
          }
        }
        queue = readQueue();
      }
    } finally {
      draining.current = false;
    }

    if (synced > 0) {
      markOnline();
      triggerRefetch();
      addToast(
        "success",
        `Synced ${synced} offline change${synced !== 1 ? "s" : ""}.`
      );
    }
    if (dropped.length > 0) {
      addToast(
        "error",
        `${dropped.length} offline change${dropped.length !== 1 ? "s" : ""} could not be synced and ${dropped.length !== 1 ? "were" : "was"} discarded.`
      );
    }
  }, [triggerRefetch, addToast]);

  // Probe connectivity on mount, on a timer, when the tab regains focus, and on
  // the browser's own online/offline events.
  useEffect(() => {
    if (!user) return;
    checkConnectivity();
    const interval = setInterval(checkConnectivity, POLL_MS);
    const onFocus = () => checkConnectivity();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("online", onFocus);
    window.addEventListener("offline", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("online", onFocus);
      window.removeEventListener("offline", onFocus);
    };
  }, [user, checkConnectivity]);

  // Drain on mount (queued items from a previous session) and whenever
  // connectivity transitions back to online.
  useEffect(() => {
    if (!user) return;
    if (wasOffline.current && !offline) drain();
    wasOffline.current = offline;
  }, [user, offline, drain]);

  useEffect(() => {
    if (user) drain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return <ToastContainer toasts={toasts} onDismiss={dismiss} />;
}

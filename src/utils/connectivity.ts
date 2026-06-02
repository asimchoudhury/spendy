import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { isNetworkError } from "@/utils/offlineQueue";

// Global connectivity belief, shared across the app. It combines two signals:
//   1. Browser online/offline events (fast, but unreliable in some environments
//      — e.g. DevTools network throttling doesn't always flip navigator.onLine).
//   2. Actual Supabase reachability, reported by the data hooks via markOffline()/
//      markOnline() when a request fails with a network error or succeeds.
// The second signal is authoritative: it's the same thing that drives the inline
// offline messages, so the banner and the messages always agree.

let offline = typeof navigator !== "undefined" ? !navigator.onLine : false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function markOffline(): void {
  if (!offline) {
    offline = true;
    emit();
  }
}

export function markOnline(): void {
  if (offline) {
    offline = false;
    emit();
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): boolean {
  return offline;
}

function getServerSnapshot(): boolean {
  return false;
}

// Wire OS/browser connectivity events once, on the client.
if (typeof window !== "undefined") {
  window.addEventListener("offline", markOffline);
  window.addEventListener("online", markOnline);
}

// Subscribe a component to the connectivity belief. Returns true when offline.
export function useOffline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Actively confirms reachability with a head-only count query and updates the
// shared belief. Use this at the moment of a connection-dependent action (export,
// import) where a stale cached belief isn't good enough — e.g. just after the
// device went offline, before navigator.onLine flips or the poll runs.
// Returns true when the server is reachable.
export async function probeOnline(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("expenses")
      .select("id", { head: true, count: "exact" });
    if (error && isNetworkError(error)) {
      markOffline();
      return false;
    }
    markOnline();
    return true;
  } catch (e) {
    if (isNetworkError(e)) {
      markOffline();
      return false;
    }
    markOnline();
    return true;
  }
}

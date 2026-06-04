import { supabase } from "@/lib/supabase";
import { DbExpenseRow } from "@/utils/expenseMapping";

// Durable queue of expense mutations that failed because the device was offline.
// Entries are replayed against Supabase, in insertion order, once connectivity
// returns (see OfflineSyncManager). Payloads are stored in DB-row shape so replay
// is a direct Supabase call with no re-mapping.

const QUEUE_KEY = "offline-expense-queue";
const MAX_RETRIES = 5;

type BaseEntry = { id: string; timestamp: number; retryCount: number };

export type QueueEntry =
  | (BaseEntry & { type: "add"; row: DbExpenseRow })
  | (BaseEntry & {
      type: "update";
      expenseId: string;
      userId: string;
      fields: Partial<DbExpenseRow>;
    })
  | (BaseEntry & { type: "delete"; expenseId: string; userId: string });

export { MAX_RETRIES };

function genEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function readQueue(): QueueEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueueEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeQueue(entries: QueueEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full / unavailable — nothing we can safely do here.
  }
}

// Appends an entry, assigning it an id/timestamp/retryCount. Returns the stored entry.
export function enqueue(
  entry:
    | { type: "add"; row: DbExpenseRow }
    | { type: "update"; expenseId: string; userId: string; fields: Partial<DbExpenseRow> }
    | { type: "delete"; expenseId: string; userId: string }
): QueueEntry {
  const stored = {
    id: genEntryId(),
    timestamp: Date.now(),
    retryCount: 0,
    ...entry,
  } as QueueEntry;
  writeQueue([...readQueue(), stored]);
  return stored;
}

export function removeFromQueue(entryId: string): void {
  writeQueue(readQueue().filter((e) => e.id !== entryId));
}

export function clearQueue(): void {
  writeQueue([]);
}

// True when a failure is due to lost connectivity (vs. a legitimate server
// rejection). Such failures are safe to retry; server errors are not.
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
  return /failed to fetch|networkerror|load failed|fetch failed|network request failed/i.test(
    message
  );
}

// Runs an optimistic Supabase write and routes the outcome without ever throwing:
//   • success                         → nothing
//   • lost connectivity               → onNetworkError() (caller enqueues for replay)
//   • genuine server rejection        → onServerError(message) (caller rolls back)
// Both a resolved `{ error }` AND a rejected promise (e.g. a thrown
// "Failed to fetch") are handled here, so a thrown fetch can't slip past the
// caller's offline/rollback handling.
export async function commitWrite(
  write: () => PromiseLike<{ error: unknown }>,
  handlers: { onNetworkError: () => void; onServerError: (message: string) => void }
): Promise<void> {
  try {
    const { error } = await write();
    if (error) throw error;
  } catch (err) {
    if (isNetworkError(err)) handlers.onNetworkError();
    else handlers.onServerError(errorMessage(err));
  }
}

// Pulls a human-readable message out of whatever a failed write threw/returned.
// Supabase rejections are plain PostgrestError objects (a `message` field, not
// an Error instance), so `String(err)` would yield "[object Object]" — handle
// objects explicitly.
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

// User-facing copy for a write that failed because the device is offline.
export const OFFLINE_WRITE_MESSAGE =
  "You're offline — this change can't be saved yet. Reconnect to the internet and try again.";

// Translates a raw error (string or Error, e.g. "TypeError: Failed to fetch")
// into something a user can act on. Network failures become the offline message;
// anything else passes through.
export function friendlyError(err: unknown): string {
  if (isNetworkError(err)) return OFFLINE_WRITE_MESSAGE;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong. Please try again.";
}

export type ReplayResult =
  | { ok: true }
  | { ok: false; network: boolean; message: string };

// Replays a single queued mutation against Supabase.
export async function replayEntry(entry: QueueEntry): Promise<ReplayResult> {
  try {
    let error: { message: string } | null = null;
    if (entry.type === "add") {
      ({ error } = await supabase.from("expenses").insert(entry.row));
    } else if (entry.type === "update") {
      ({ error } = await supabase
        .from("expenses")
        .update(entry.fields)
        .eq("id", entry.expenseId)
        .eq("user_id", entry.userId));
    } else {
      ({ error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", entry.expenseId)
        .eq("user_id", entry.userId));
    }
    if (error) {
      return { ok: false, network: isNetworkError(error), message: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      network: isNetworkError(err),
      message: err instanceof Error ? err.message : "Replay failed",
    };
  }
}

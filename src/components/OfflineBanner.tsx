"use client";

import { useState } from "react";
import { WifiOff, X } from "lucide-react";
import { useOffline } from "@/utils/connectivity";

// A dismissible banner shown app-wide while the device is offline. It reassures
// the user that expenses can still be added (and will sync on reconnect) and that
// other changes are paused until they're back online. Dismissal lasts only for the
// current offline episode — going back online resets it, so the next disconnect
// shows it again.
export function OfflineBanner() {
  const offline = useOffline();
  const [dismissed, setDismissed] = useState(false);

  // Reset the dismissal whenever connectivity returns, so the next disconnect
  // shows the banner again. This is React's "adjust state during render" pattern
  // — preferred over a state-setting effect.
  const [wasOffline, setWasOffline] = useState(offline);
  if (offline !== wasOffline) {
    setWasOffline(offline);
    if (!offline) setDismissed(false);
  }

  if (!offline || dismissed) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <WifiOff size={18} className="mt-0.5 shrink-0 text-amber-500" />
      <div className="flex-1 text-sm text-amber-800">
        <p className="font-semibold">You&apos;re offline</p>
        <p className="mt-0.5 text-amber-700">
          You can keep adding expenses — they&apos;ll sync automatically when you
          reconnect, so nothing is lost. Editing categories and viewing saved data
          stays paused until you&apos;re back online.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1 text-amber-500 transition-colors hover:bg-amber-100 hover:text-amber-700"
      >
        <X size={16} />
      </button>
    </div>
  );
}

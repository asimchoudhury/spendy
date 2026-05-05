"use client";

import { useState, useRef } from "react";
import { X, AlertTriangle, HardDrive } from "lucide-react";

interface StorageWarningBannerProps {
  percentage: number;
  onExportJSON: () => void;
}

export function StorageWarningBanner({ percentage, onExportJSON }: StorageWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  if (dismissed || percentage < 90) return null;

  return (
    <>
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">
            Storage is {Math.round(percentage)}% full. Export your data as JSON backup and delete old
            expenses to continue using Spendy. You can import your backup later to restore old records.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button
              onClick={onExportJSON}
              className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={() => setShowTips(true)}
              className="px-3 py-1 rounded-lg border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              How to free space?
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <HardDrive size={12} />
            <span className="font-semibold">{Math.round(percentage)}%</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-100 transition-colors"
            aria-label="Dismiss warning"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {showTips && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === overlayRef.current) setShowTips(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">How to Free Up Space</h2>
              <button
                onClick={() => setShowTips(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-3">
              {[
                "Click Export JSON to save your backup",
                "Go to Expenses page",
                "Delete old expenses you no longer need",
                "When you want to view old records, use the Import button to restore your JSON backup",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{step}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => setShowTips(false)}
                className="w-full px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

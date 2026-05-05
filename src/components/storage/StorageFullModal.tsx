"use client";

import { useRef } from "react";
import { X, Download, Receipt } from "lucide-react";

interface StorageFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJSON: () => void;
  onGoToExpenses: () => void;
}

export function StorageFullModal({
  isOpen,
  onClose,
  onExportJSON,
  onGoToExpenses,
}: StorageFullModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const steps = [
    { label: "Step 1:", text: "Export your data as JSON backup using the button below" },
    { label: "Step 2:", text: "Go to Expenses page and delete old expenses to free space" },
    { label: "Step 3:", text: "Come back and add your expense" },
    { label: "Step 4:", text: "Later, use Import button on the Expenses page to restore your old records anytime" },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">🚨 Storage is Full!</h2>
            <p className="text-sm text-red-600 mt-1 font-medium">
              You cannot add new expenses until you free up space.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-sm text-gray-600 font-medium">Follow these steps:</p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-gray-700 leading-snug">
                <span className="font-semibold text-gray-900">{s.label}</span>{" "}
                {s.text}
              </p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onExportJSON}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            <Download size={15} />
            Export JSON Now
          </button>
          <button
            onClick={onGoToExpenses}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <Receipt size={15} />
            Go to Expenses
          </button>
          <button
            onClick={onClose}
            className="sm:flex-none px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

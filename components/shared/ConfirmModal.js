"use client";

import { useEffect, useState } from "react";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Yes, delete it", 
  cancelText = "Cancel",
  isDanger = true 
}) {
  const [busy, setBusy] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && isOpen && !busy) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, busy, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      // Error handled by parent
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => { if (!busy) onClose(); }}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-sm rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          
          {/* Icon */}
          <div className={`h-14 w-14 rounded-full flex items-center justify-center ${isDanger ? 'bg-rose-500/10 text-rose-500' : 'bg-ts-primary/10 text-ts-primary'}`}>
            {isDanger ? (
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            )}
          </div>

          {/* Text */}
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-ts-muted mt-1 leading-relaxed">{message}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full mt-2">
            <button
              onClick={onClose}
              disabled={busy}
              className="flex-1 rounded-ts-sm border border-ts-border bg-ts-surface px-4 py-2.5 text-sm font-medium hover:bg-ts-surface-2 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className={`flex-1 rounded-ts-sm px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-70 flex justify-center items-center gap-2 ${
                isDanger ? "bg-rose-500 hover:bg-rose-600" : "bg-ts-primary hover:opacity-90"
              }`}
            >
              {busy ? (
                <>
                  <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                  </svg>
                  Processing...
                </>
              ) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

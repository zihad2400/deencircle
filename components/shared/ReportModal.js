"use client";

import { useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";

export default function ReportModal({ isOpen, onClose, targetType, targetId }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      if (!res.ok) {
        toast.error("Error", "Could not submit report");
        return;
      }
      toast.success("Reported", "Admins will review this content.");
      setReason("");
      onClose();
    } catch {
      toast.error("Error", "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold mb-1">Report {targetType === "post" ? "Post" : "Comment"}</h3>
        <p className="text-sm text-ts-muted mb-4">Help us keep DeenCircle safe. Why are you reporting this?</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g., Spam, harassment, inappropriate content..."
            className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ts-primary/50 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-ts-sm border border-ts-border px-4 py-2 text-sm hover:bg-ts-surface-2">
              Cancel
            </button>
            <button type="submit" disabled={busy || !reason.trim()}
              className="rounded-ts-sm bg-amber-500 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:bg-amber-600">
              {busy ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/shared/ToastProvider";

export default function BookmarkButton({ postId }) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Note: To make it truly dynamic, we should fetch initial state from the server.
  // For now, clicking toggles it.

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Login Required", "Please log in to save posts.");
          return;
        }
        toast.error("Error", data.error || "Could not save");
        return;
      }
      setSaved(data.saved);
      toast.success("Saved", data.saved ? "Post saved to your bookmarks" : "Removed from bookmarks");
    } catch {
      toast.error("Error", "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`flex items-center justify-center p-2 rounded-md hover:bg-ts-surface-2 transition-colors ${saved ? "text-ts-primary" : "text-ts-muted"}`}
      title={saved ? "Remove Bookmark" : "Save Post"}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  );
}

"use client";

import { useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";

export default function EditPostModal({ post, onClose, onUpdate }) {
  const toast = useToast();
  const [content, setContent] = useState(post.content);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || content === post.content) return;
    setBusy(true);
    
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        toast.error("Edit Failed", data.error || "Could not update post");
        return;
      }
      
      toast.success("Updated", "Post has been edited successfully");
      onUpdate({ ...post, content, edited: true });
      onClose();
    } catch {
      toast.error("Error", "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-ts-border px-4 py-3">
          <h2 className="text-lg font-semibold">Edit Post</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-ts-surface-2 text-ts-muted">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ts-primary/50 resize-none"
            placeholder="What's on your mind?"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-ts-sm border border-ts-border px-4 py-2 text-sm hover:bg-ts-surface-2">
              Cancel
            </button>
            <button type="submit" disabled={busy || !content.trim() || content === post.content}
              className="rounded-ts-sm bg-ts-primary px-4 py-2 text-sm text-ts-primary-text disabled:opacity-50 hover:bg-ts-primary/90">
              {busy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

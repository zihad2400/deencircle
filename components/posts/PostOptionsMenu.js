"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import ConfirmModal from "@/components/shared/ConfirmModal";

export default function PostOptionsMenu({ post, onEdit, onDelete }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleDeleteConfirm() {
    try {
      const res = await fetch(`/api/posts/${post._id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        toast.error("Delete Failed", d.error || "Could not delete post");
        throw new Error("failed");
      }
      toast.success("Deleted", "Post has been deleted successfully");
      onDelete(post._id);
    } catch (e) {
      toast.error("Error", "Network error while deleting");
      throw e; // Re-throw so modal stays open
    }
  }

  return (
    <>
      <div ref={ref} className="relative ml-auto">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 rounded-full hover:bg-ts-surface-2 flex items-center justify-center text-ts-muted transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-40 rounded-ts-sm border border-ts-border bg-ts-surface shadow-ts-2 z-30 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={() => { setOpen(false); onEdit(post); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-ts-surface-2 flex items-center gap-2"
            >
              ✏️ Edit Post
            </button>
            <button
              onClick={() => { setOpen(false); setShowConfirm(true); }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-rose-500/10 text-rose-500 flex items-center gap-2"
            >
              🗑️ Delete Post
            </button>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This action cannot be undone and will remove all reactions and comments."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </>
  );
}

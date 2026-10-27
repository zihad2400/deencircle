"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import ConfirmModal from "@/components/shared/ConfirmModal";
import ReportModal from "@/components/shared/ReportModal";

export default function PostOptionsMenu({ post, onEdit, onDelete, isAdmin }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
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
        toast.error("Delete Failed", "Could not delete post");
        throw new Error("failed");
      }
      toast.success("Deleted", "Post has been deleted");
      onDelete(post._id);
    } catch (e) {
      throw e;
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
          <div className="absolute right-0 top-full mt-1 w-44 rounded-ts-sm border border-ts-border bg-ts-surface shadow-ts-2 z-30 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
            {isAdmin ? (
              <>
                <button
                  onClick={() => { setOpen(false); onEdit(post); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-ts-surface-2 flex items-center gap-2"
                >
                  ✏️ Edit Post
                </button>
                <button
                  onClick={() => { setOpen(false); setShowDeleteConfirm(true); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-rose-500/10 text-rose-500 flex items-center gap-2"
                >
                  🗑️ Delete Post
                </button>
              </>
            ) : (
              <button
                onClick={() => { setOpen(false); setShowReportModal(true); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-amber-500/10 text-amber-500 flex items-center gap-2"
              >
                ⚠️ Report Post
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />

      <ReportModal 
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={post._id}
      />
    </>
  );
}

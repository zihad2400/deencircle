"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import ConfirmModal from "@/components/shared/ConfirmModal";

export default function AdminPostsList() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ডিলিট কনফার্মেশন মডালের জন্য স্টেট
  const [deletingPostId, setDeletingPostId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/posts?status=published&limit=50", { cache: "no-store" });
      const d = await res.json();
      setItems(d.posts || []);
    } finally { setLoading(false); }
  }
  
  useEffect(() => { load(); }, []);

  function confirmDelete(id) {
    setDeletingPostId(id);
  }

  async function executeDelete() {
    if (!deletingPostId) return;
    try {
      const res = await fetch(`/api/posts/${deletingPostId}`, { method: "DELETE" });
      if (!res.ok) { 
        toast.error("Delete Failed", "Could not delete post"); 
        throw new Error("Failed"); 
      }
      toast.success("Deleted", "Post and all its data removed");
      await load();
    } catch (e) {
      throw e; 
    }
  }

  async function togglePin(id, pinned) {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !pinned }),
      });
      if (!res.ok) { toast.error("Update", "failed"); return; }
      toast.success("Updated", pinned ? "Post unpinned" : "Post pinned");
      await load();
    } catch { toast.error("Update", "network_error"); }
  }

  if (loading) return <p className="text-sm text-ts-muted animate-pulse">Loading posts...</p>;
  if (items.length === 0) return <p className="text-sm text-ts-muted">No posts yet.</p>;

  return (
    <div>
      <ul className="divide-y divide-ts-border">
        {items.map((p) => (
          <li key={p._id} className="py-4 flex gap-4 items-start group">
            <div className="min-w-0 flex-1">
              <p className="text-sm whitespace-pre-wrap line-clamp-3">{p.content}</p>
              <p className="mt-1.5 text-xs text-ts-muted flex items-center gap-2">
                <span>By {p.authorName || "Admin"}</span>
                <span>·</span>
                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                {p.pinned && <span className="text-ts-primary font-medium ml-1">📌 Pinned</span>}
              </p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => togglePin(p._id, p.pinned)}
                className="rounded-ts-sm border border-ts-border bg-ts-surface px-2.5 py-1.5 text-xs font-medium hover:bg-ts-surface-2 transition-colors">
                {p.pinned ? "Unpin" : "Pin"}
              </button>
              <button onClick={() => confirmDelete(p._id)}
                className="rounded-ts-sm border border-rose-500/30 bg-rose-500/10 text-rose-500 px-2.5 py-1.5 text-xs font-medium hover:bg-rose-500/20 transition-colors">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* কাস্টম ডিলিট মডাল */}
      <ConfirmModal 
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        onConfirm={executeDelete}
        title="Delete Post?"
        message="Are you sure you want to delete this post? This will permanently remove all its comments and reactions."
        confirmText="Delete Post"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}

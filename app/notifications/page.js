"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shared/ToastProvider";
import { useLang } from "@/components/shared/LanguageProvider";

const TYPE_ICON = {
  post_published: "📣", comment_reply: "💬", reaction: "❤️", system: "🔔", moderation: "🛡️",
};

export default function NotificationsPage() {
  const toast = useToast();
  const router = useRouter();
  const { lang } = useLang();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications?limit=50", { cache: "no-store" });
      if (r.status === 401) { router.push("/login"); return; }
      const d = await r.json();
      setItems(d.items || []); 
      setUnread(d.unread || 0);
    } finally { setLoading(false); }
  }
  
  useEffect(() => { load(); }, []);

  async function markAll() {
    try {
      await fetch("/api/notifications/read", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      toast.success("Notifications", "All marked as read");
      await load();
    } catch {
      toast.error("Error", "Network error");
    }
  }

  async function deleteNotification(id) {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems(prev => prev.filter(n => n.id !== id));
        toast.success("Deleted", "Notification removed");
      }
    } catch {
      toast.error("Error", "Could not delete");
    }
  }

  if (loading) return <div className="max-w-2xl mx-auto py-10 text-center text-ts-muted">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {unread > 0 && (
          <button onClick={markAll} className="text-sm text-ts-primary font-medium hover:underline">
            Mark all read
          </button>
        )}
      </div>
      
      {items.length === 0 ? (
        <p className="text-sm text-ts-muted text-center py-10">No notifications yet.</p>
      ) : (
        <ul className="rounded-ts-lg border border-ts-border bg-ts-surface divide-y divide-ts-border overflow-hidden shadow-ts-1">
          {items.map((n) => (
            <li key={n.id} className={`flex gap-3 p-4 transition-colors hover:bg-ts-surface-2 ${n.read ? "" : "bg-ts-primary-soft/20"}`}>
              <Link href={n.link || "#"} className="flex gap-3 flex-1 min-w-0">
                <span className="h-10 w-10 flex-none rounded-full bg-ts-surface-2 flex items-center justify-center text-lg">
                  {TYPE_ICON[n.type] || "🔔"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.read ? "font-normal" : "font-semibold"}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-ts-muted truncate mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-ts-muted mt-1">
                    <time suppressHydrationWarning>{new Date(n.createdAt).toLocaleString()}</time>
                  </p>
                </div>
              </Link>
              <button 
                onClick={() => deleteNotification(n.id)}
                className="self-start text-ts-muted hover:text-rose-500 p-1"
                title="Delete"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

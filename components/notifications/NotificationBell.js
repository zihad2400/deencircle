"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/shared/LanguageProvider";
import { useToast } from "@/components/shared/ToastProvider";

const TYPE_ICON = {
  post_published: "📣",
  comment_reply: "💬",
  reaction: "❤️",
  system: "🔔",
  moderation: "🛡️",
  message: "💬",
};

function timeAgo(iso, lang) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "bn" ? "এখনই" : lang === "ar" ? "الآن" : "just now";
  if (mins < 60) return lang === "bn" ? `${mins} মি. আগে` : lang === "ar" ? `قبل ${mins} د` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "bn" ? `${hours} ঘ. আগে` : lang === "ar" ? `قبل ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === "bn" ? `${days} দিন আগে` : lang === "ar" ? `قبل ${days} ي` : `${days}d ago`;
}

export default function NotificationBell() {
  const { lang, tr } = useLang();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const ref = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=15", { cache: "no-store" });
      if (res.status === 401) { setAuthed(false); return; }
      const data = await res.json();
      setAuthed(true);
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function markAll() {
    setLoading(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Notifications", "All marked as read");
    } catch {
      toast.error("Error", "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function markOne(id) {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  }

  async function deleteNotification(id, e) {
    e.preventDefault(); // লিংকে ক্লিক আটকাতে
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((n) => n.id !== id));
        toast.success("Deleted", "Notification removed");
      }
    } catch {
      toast.error("Error", "Could not delete");
    }
  }

  if (!authed) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={tr("nav.notifications")}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center justify-center p-2 rounded-full border border-ts-border bg-ts-surface hover:bg-ts-surface-2 transition-colors ${open ? 'ring-2 ring-ts-primary/40' : ''}`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ts-text">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        
        {unread > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-ts-surface">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 sm:hidden animate-in fade-in" onClick={() => setOpen(false)} />
          
          <div className="fixed sm:absolute inset-x-2 top-16 sm:inset-auto sm:right-0 sm:top-full sm:mt-2 z-50 sm:w-[360px] rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            
            <div className="flex items-center justify-between border-b border-ts-border px-4 py-3">
              <p className="text-sm font-semibold">{tr("nav.notifications")}</p>
              <button
                onClick={markAll}
                disabled={loading || unread === 0}
                className="text-xs font-medium text-ts-primary disabled:opacity-40 hover:underline"
              >
                {lang === "bn" ? "সব পড়া হয়েছে" : lang === "ar" ? "تحديد الكل كمقروء" : "Mark all read"}
              </button>
            </div>

            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
              {items.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-ts-muted">
                  {lang === "bn" ? "কোনো বিজ্ঞপ্তি নেই" : lang === "ar" ? "لا توجد إشعارات" : "No notifications yet"}
                </p>
              )}
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.link || "#"}
                      onClick={() => { if (!n.read) markOne(n.id); setOpen(false); }}
                      className={`flex gap-3 px-4 py-3 border-b border-ts-border last:border-b-0 hover:bg-ts-surface-2 transition-colors ${n.read ? "" : "bg-ts-primary-soft/30"}`}
                    >
                      <span className="mt-0.5 h-8 w-8 flex-none rounded-full bg-ts-surface-2 flex items-center justify-center text-sm">
                        {TYPE_ICON[n.type] || "🔔"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${n.read ? "font-normal" : "font-semibold"}`}>{n.title}</span>
                        {n.body && <span className="block text-xs text-ts-muted truncate mt-0.5">{n.body}</span>}
                        <span className="block mt-1 text-[10px] text-ts-muted">{timeAgo(n.createdAt, lang)}</span>
                      </span>
                      <button 
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="self-start text-ts-muted hover:text-rose-500 p-1"
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-ts-border px-4 py-3 text-center text-xs font-medium text-ts-primary hover:bg-ts-surface-2">
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

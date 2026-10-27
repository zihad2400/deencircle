"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";

export default function ModerationPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports?status=pending", { cache: "no-store" });
      if (!res.ok) { toast.error("Reports", "load_failed"); return; }
      const d = await res.json();
      setItems(d.items || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { toast.error("Action", "failed"); return; }
      toast.success("Action", action);
      await load();
    } catch { toast.error("Action", "network_error"); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Moderation</h1>
      {loading ? <p className="text-sm text-ts-muted">…</p> : items.length === 0 ? (
        <p className="text-sm text-ts-muted">No pending reports 🎉</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-ts border border-ts-border bg-ts-surface p-4">
              <div className="text-xs text-ts-muted">
                {r.targetType} · by {r.reporterEmail} · <time suppressHydrationWarning>{new Date(r.createdAt).toLocaleString()}</time>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{r.reason}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => act(r.id, "approve")}
                  className="rounded-ts-sm bg-rose-500 text-white px-3 py-1.5 text-sm">
                  Approve (remove content)
                </button>
                <button onClick={() => act(r.id, "dismiss")}
                  className="rounded-ts-sm border border-ts-border px-3 py-1.5 text-sm">
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

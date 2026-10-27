"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";

export default function UsersPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const d = await res.json();
      setItems(d.items || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function toggleStatus(u) {
    const next = u.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) { const d = await res.json(); toast.error("Update", d.error || "failed"); return; }
      toast.success("Update", next);
      await load();
    } catch { toast.error("Update", "network_error"); }
  }

  if (loading) return <p className="text-sm text-ts-muted">…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      <ul className="rounded-ts border border-ts-border bg-ts-surface divide-y divide-ts-border">
        {items.map((u) => (
          <li key={u.id} className="px-4 py-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{u.displayName} <span className="text-ts-muted">({u.email})</span></p>
              <p className="text-xs text-ts-muted">role: {u.role} · status: {u.status}</p>
            </div>
            <button onClick={() => toggleStatus(u)}
              className={`rounded-ts-sm px-3 py-1.5 text-xs ${
                u.status === "active"
                  ? "border border-rose-500/40 text-rose-500"
                  : "border border-emerald-500/40 text-emerald-500"
              }`}>
              {u.status === "active" ? "Suspend" : "Reactivate"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import Link from "next/link";

export default function ModerationPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports?status=pending", { cache: "no-store" });
      if (!res.ok) { 
        toast.error("Error", "Could not load reports"); 
        return; 
      }
      const d = await res.json();
      setItems(d.items || []);
    } finally { 
      setLoading(false); 
    }
  }
  
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { 
        toast.error("Action Failed", "Please try again"); 
        return; 
      }
      toast.success("Success", action === "approve" ? "Content removed" : "Report dismissed");
      await load();
    } catch { 
      toast.error("Error", "Network error"); 
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Moderation Queue</h1>
        <p className="text-sm text-ts-muted mt-1">Review reported content from your community.</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-ts-lg border border-ts-border bg-ts-surface animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="rounded-ts-lg border border-dashed border-ts-border bg-ts-surface p-12 text-center">
          <span className="text-4xl">✅</span>
          <h2 className="mt-3 text-lg font-semibold">All clear!</h2>
          <p className="text-sm text-ts-muted mt-1">No pending reports to review.</p>
          <Link href="/admin" className="inline-block mt-4 text-sm text-ts-primary hover:underline">← Back to Dashboard</Link>
        </div>
      )}

      {/* Reports List */}
      {!loading && items.length > 0 && (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id} className="rounded-ts-lg border border-ts-border bg-ts-surface p-5 shadow-ts-1 flex flex-col gap-4">
              
              {/* Meta */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.targetType === "post" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                    }`}>
                      {r.targetType}
                    </span>
                    <span className="text-xs text-ts-muted">Reported by {r.reporterEmail}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-ts-text">{r.reason}</p>
                  <p className="text-xs text-ts-muted mt-1">
                    <time suppressHydrationWarning>{new Date(r.createdAt).toLocaleString()}</time>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-ts-border">
                <button 
                  onClick={() => act(r.id, "approve")}
                  className="flex-1 sm:flex-none rounded-ts-sm bg-rose-500 text-white px-4 py-2 text-sm font-semibold hover:bg-rose-600 transition-colors">
                  Approve & Remove Content
                </button>
                <button 
                  onClick={() => act(r.id, "dismiss")}
                  className="flex-1 sm:flex-none rounded-ts-sm border border-ts-border px-4 py-2 text-sm font-semibold hover:bg-ts-surface-2 transition-colors">
                  Dismiss Report
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shared/ToastProvider";

export default function AdminPostForm() {
  const router = useRouter();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("published");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status, pinned }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error("Post", d.error || ""); return; }
      setContent(""); setPinned(false); setStatus("published");
      toast.success("Post", "published");
      router.refresh();
    } catch {
      toast.error("Post", "network_error");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4}
        placeholder="What's happening in the community?"
        className="w-full rounded-ts-sm border border-ts-border bg-ts-surface px-3 py-2 text-sm" />
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-sm">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="mr-1" />
          Pinned
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="rounded-ts-sm border border-ts-border bg-ts-surface px-2 py-1 text-sm">
          <option value="published">Publish now</option>
          <option value="draft">Save draft</option>
        </select>
        <button type="submit" disabled={busy || !content.trim()}
          className="ml-auto rounded-ts-sm bg-ts-primary px-3 py-1.5 text-sm text-ts-primary-text disabled:opacity-50">
          {busy ? "…" : "Post"}
        </button>
      </div>
    </form>
  );
}

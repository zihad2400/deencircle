"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/shared/ToastProvider";
import { useAuth } from "@/components/shared/AuthProvider";

export default function FollowButton({ targetUserId }) {
  const toast = useToast();
  const { user: me } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me || String(me.id) === String(targetUserId)) { 
      setLoading(false); 
      return; 
    }
    
    fetch(`/api/users/${targetUserId}/follow/status`)
      .then(res => res.json())
      .then(d => setFollowing(d.following || false))
      .catch(() => setFollowing(false))
      .finally(() => setLoading(false));
  }, [targetUserId, me]);

  async function toggleFollow() {
    if (!me) { toast.error("Login Required", "Please log in to follow."); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error("Error", data.error || "Could not follow"); return; }
      setFollowing(data.following);
      toast.success(data.following ? "Following" : "Unfollowed", "");
    } catch { toast.error("Error", "Network error"); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="h-8 w-20 bg-ts-surface-2 rounded-full animate-pulse" />;
  if (me && String(me.id) === String(targetUserId)) return null;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/messages?with=${targetUserId}`}
        className="rounded-full border border-ts-border bg-ts-surface px-4 py-1.5 text-xs font-bold text-ts-text hover:bg-ts-surface-2 transition-colors flex items-center gap-1.5"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        Message
      </Link>

      <button 
        onClick={toggleFollow}
        disabled={busy}
        className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
          following 
            ? "border border-ts-border bg-ts-surface-2 text-ts-text hover:border-rose-500 hover:text-rose-500" 
            : "bg-ts-primary text-white hover:bg-ts-primary/90"
        }`}
      >
        {busy ? "..." : following ? "Following" : "Follow"}
      </button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/components/shared/LanguageProvider";
import { useToast } from "@/components/shared/ToastProvider";
import ReactionBar from "@/components/reactions/ReactionBar";
import CommentSection from "@/components/comments/CommentSection";
import PostOptionsMenu from "@/components/posts/PostOptionsMenu";
import EditPostModal from "@/components/posts/EditPostModal";
import UserAvatar from "@/components/shared/UserAvatar";
import Link from "next/link";

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n;
}

function timeAgo(iso, lang) {
  if (!iso) return "";
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === "bn" ? "এখনই" : lang === "ar" ? "الآن" : "just now";
  if (mins < 60) return lang === "bn" ? `${mins} মিনিট আগে` : lang === "ar" ? `قبل ${mins} د` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === "bn" ? `${hours} ঘণ্টা আগে` : lang === "ar" ? `قبل ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return lang === "bn" ? `${days} দিন আগে` : lang === "ar" ? `قبل ${days} ي` : `${days}d ago`;
}

function SkeletonCard() {
  return (
    <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-4 shadow-ts-1 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-ts-surface-2" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-ts-surface-2" />
          <div className="h-2 w-20 rounded bg-ts-surface-2" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-ts-surface-2 mb-2" />
      <div className="h-3 w-11/12 rounded bg-ts-surface-2 mb-2" />
      <div className="h-3 w-9/12 rounded bg-ts-surface-2" />
    </div>
  );
}

export default function HomeFeed() {
  const { tr, lang } = useLang();
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [state, setState] = useState({ status: "loading", posts: [], error: null });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [feedType, setFeedType] = useState("all");
  const [editingPost, setEditingPost] = useState(null);
  
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setMe(d.user)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      const qs = new URLSearchParams({ status: "published", limit: "20", sort, feed: feedType });
      if (q.trim()) qs.set("q", q.trim());
      const res = await fetch(`/api/posts?${qs}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState({ status: "ready", posts: data.posts || [], error: null });
    } catch (e) {
      setState({ status: "error", posts: [], error: e.message });
    }
  }, [q, sort, feedType]);

  useEffect(() => { load(); }, [load]);

  async function handleShareClick(post) {
    const url = `${window.location.origin}/#post-${post._id}`;
    const shareData = { title: "DeenCircle Post", text: post.content.slice(0, 100), url };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Shared", "Post shared successfully");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link Copied", "Post link copied");
      }
      await fetch(`/api/posts/${post._id}/share`, { method: "POST" });
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(p => p._id === post._id ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p)
      }));
    } catch (err) {
      if (err.name !== "AbortError") toast.error("Error", "Could not share");
    }
  }

  function handlePostDeleted(id) {
    setState(prev => ({ ...prev, posts: prev.posts.filter(p => p._id !== id) }));
  }

  function handlePostUpdated(updatedPost) {
    setState(prev => ({ ...prev, posts: prev.posts.map(p => p._id === updatedPost._id ? updatedPost : p) }));
  }

  const isAdmin = me?.role === "admin";

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{tr("feed.title")}</h1>
        <p className="text-sm text-ts-muted">{tr("feed.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ts-border mb-2">
        <button onClick={() => setFeedType("all")} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${feedType === "all" ? "border-ts-primary text-ts-primary" : "border-transparent text-ts-muted hover:text-ts-text"}`}>For You</button>
        <button onClick={() => setFeedType("following")} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${feedType === "following" ? "border-ts-primary text-ts-primary" : "border-transparent text-ts-muted hover:text-ts-text"}`}>Following</button>
      </div>

      {/* Search & Sort Bar - Responsive */}
      <div className="flex justify-end mb-4">
        <div className="relative w-full sm:w-auto shrink-0">
          <select 
            value={sort} 
            onChange={(e) => setSort(e.target.value)}
            className="w-full appearance-none rounded-full border border-ts-border bg-ts-surface pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ts-primary/50 cursor-pointer">
            <option value="newest">Newest</option>
            <option value="top">Most Reacted</option>
          </select>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ts-muted text-xs">▼</span>
        </div>
      </div>

      {state.status === "loading" && <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>}
      
      {state.status === "error" && (
        <div className="rounded-ts border border-ts-border bg-ts-surface p-6 text-center">
          <p className="text-sm text-ts-danger">{tr("feed.error")}</p>
          <button onClick={load} className="mt-3 rounded-ts-sm bg-ts-primary px-4 py-2 text-sm text-ts-primary-text">
            {tr("actions.retry")}
          </button>
        </div>
      )}

      {state.status === "ready" && state.posts.length === 0 && (
        <div className="rounded-ts border border-dashed border-ts-border bg-ts-surface p-8 text-center text-sm text-ts-muted">
          {tr("feed.empty")}
        </div>
      )}

      {state.status === "ready" && state.posts.length > 0 && (
        <ul className="space-y-4">
          {state.posts.map((p) => (
            <li key={p._id} id={`post-${p._id}`}
                className="rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-1 overflow-hidden">
              
              <div className="flex items-start gap-2 p-3 pb-2">
                <Link href={`/profile/${String(p.authorId)}`} className="shrink-0">
                  <UserAvatar name={p.authorName} role="admin" avatarUrl={p.authorAvatar} size={42} />
                </Link>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <Link href={`/profile/${String(p.authorId)}`} className="font-semibold text-[15px] hover:underline truncate max-w-[120px] sm:max-w-full">
                      {p.authorName || "Administrator"}
                    </Link>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#3b82f6" className="shrink-0">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    {p.pinned && <span className="text-[10px] bg-ts-primary-soft text-ts-primary px-1.5 py-0.5 rounded-sm font-semibold whitespace-nowrap">📌 Pinned</span>}
                  </div>
                  <div className="text-xs text-ts-muted flex items-center gap-1 mt-0.5 flex-wrap">
                    <time suppressHydrationWarning>{timeAgo(p.publishedAt || p.createdAt, lang)}</time>
                    <span>·</span>
                    <span>🌍 Public</span>
                    {p.edited && <span>· Edited</span>}
                  </div>
                </div>

                {isAdmin && (
                  <PostOptionsMenu 
                    post={p} 
                    onEdit={(post) => setEditingPost(post)} 
                    onDelete={handlePostDeleted} 
                    isAdmin={isAdmin}
                  />
                )}
              </div>

              <div className="px-3 sm:px-4 py-2">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed break-words overflow-hidden">{p.content}</p>
              </div>

              <div className="px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-ts-muted border-b border-ts-border flex-wrap gap-2">
                <div className="flex items-center gap-1">
                  {p.reactionCount > 0 ? (
                    <>
                      <span className="flex -space-x-1">
                        <span className="h-4 w-4 rounded-full bg-blue-500 border border-ts-surface flex items-center justify-center text-[9px] text-white">👍</span>
                        <span className="h-4 w-4 rounded-full bg-red-500 border border-ts-surface flex items-center justify-center text-[9px] text-white">❤️</span>
                      </span>
                      <span className="ml-1">{fmt(p.reactionCount)}</span>
                    </>
                  ) : (
                    <span>0 reactions</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <span>{p.commentCount || 0} comments</span>
                  <span>{p.shareCount || 0} shares</span>
                </div>
              </div>

              <div className="flex items-center justify-between px-2 py-1 bg-ts-surface">
                <ReactionBar 
                  postId={String(p._id)} 
                  initialReaction={p.myReaction} 
                  initialCount={p.reactionCount}
                  onUpdate={(type, newCount) => {
                    setState(prev => ({
                      ...prev,
                      posts: prev.posts.map(item => 
                        item._id === p._id ? { ...item, myReaction: type, reactionCount: newCount } : item
                      )
                    }));
                  }}
                />
                
                <button onClick={() => document.getElementById(`comments-${p._id}`)?.scrollIntoView({behavior:'smooth'})} 
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md hover:bg-ts-surface-2 text-ts-muted text-sm font-medium transition-colors">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  <span className="hidden sm:inline">Comment</span>
                </button>

                <button onClick={() => handleShareClick(p)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md hover:bg-ts-surface-2 text-ts-muted text-sm font-medium transition-colors">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>

              <div id={`comments-${p._id}`} className="px-3 sm:px-4 pb-3">
                <CommentSection 
                  postId={String(p._id)} 
                  onUpdate={(newCount) => {
                    setState(prev => ({
                      ...prev,
                      posts: prev.posts.map(item => 
                        item._id === p._id ? { ...item, commentCount: newCount } : item
                      )
                    }));
                  }}
                />
              </div>

            </li>
          ))}
        </ul>
      )}

      {editingPost && (
        <EditPostModal 
          post={editingPost} 
          onClose={() => setEditingPost(null)} 
          onUpdate={handlePostUpdated} 
        />
      )}

         </div>
  );
}

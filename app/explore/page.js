"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/shared/LanguageProvider";
import UserAvatar from "@/components/shared/UserAvatar";

export default function ExplorePage() {
  const { tr } = useLang();
  const [data, setData] = useState({ topPosts: [], suggestedUsers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/explore")
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-ts-muted animate-pulse">Loading Explore...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tr("nav.explore")}</h1>
        <p className="text-sm text-ts-muted mt-1">Discover trending posts and connect with new people.</p>
      </div>

      {/* Trending Posts Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">🔥</span> Trending Posts
        </h2>
        <div className="grid gap-3">
          {data.topPosts.length === 0 && (
            <p className="text-sm text-ts-muted p-4 border border-dashed rounded-ts text-center">No posts to show right now.</p>
          )}
          {data.topPosts.map((post) => (
            <Link 
              key={post.id} 
              href={`/#post-${post.id}`} 
              className="block rounded-ts border border-ts-border bg-ts-surface p-4 hover:bg-ts-surface-2 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-ts-text">{post.authorName}</span>
                <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  ❤️ {post.reactionCount} Reactions
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-ts-muted group-hover:text-ts-text transition-colors line-clamp-3">
                {post.content}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Suggested Users Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">👥</span> Suggested for You
        </h2>
        <div className="rounded-ts-lg border border-ts-border bg-ts-surface divide-y divide-ts-border overflow-hidden">
          {data.suggestedUsers.length === 0 && (
            <p className="text-sm text-ts-muted p-6 text-center">No suggested users.</p>
          )}
          {data.suggestedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-ts-surface-2 transition-colors">
              <Link href={`/profile/${user.id}`}>
                <UserAvatar name={user.name} role={user.role} avatarUrl={user.avatarUrl} size={48} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/profile/${user.id}`} className="font-semibold text-sm hover:underline">{user.name}</Link>
                <p className="text-xs text-ts-muted truncate">{user.bio || "New member on DeenCircle"}</p>
              </div>
              {/* ⚠️ View Profile বাটনটি এখন সম্পূর্ণ ডাইনামিক */}
              <Link 
                href={`/profile/${user.id}`}
                className="shrink-0 rounded-full border border-ts-primary text-ts-primary px-4 py-1.5 text-xs font-semibold hover:bg-ts-primary hover:text-white transition-colors"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

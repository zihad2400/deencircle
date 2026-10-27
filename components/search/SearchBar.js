"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/shared/UserAvatar";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("posts");
  const [results, setResults] = useState({ posts: [], users: [], trending: [] });
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) return;
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
        .then(r => r.json())
        .then(d => setResults(prev => ({ ...prev, ...d })))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTab]);

  useEffect(() => {
    if (!query.trim() && isFocused) {
      fetch("/api/search")
        .then(r => r.json())
        .then(d => setResults(prev => ({ ...prev, trending: d.trending || [] })))
        .catch(() => {});
    }
  }, [isFocused]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setIsFocused(false);
  }

  return (
    <div ref={ref} className="relative w-full max-w-xs z-40">
      <form onSubmit={handleSubmit}>
        <div className={`relative flex items-center bg-ts-surface-2 rounded-full h-9 px-1 transition-all duration-300 ${
          isFocused ? 'ring-1 ring-ts-primary/30 bg-ts-surface' : 'hover:bg-ts-surface-2/80'
        }`}>
          {/* Search Icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-ts-surface text-ts-muted shrink-0 ml-0.5">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Search..."
            className="flex-1 bg-transparent px-3 text-sm outline-none text-ts-text placeholder:text-ts-muted/70 border-none focus:outline-none focus:ring-0 focus:ring-offset-0"
          />
        </div>
      </form>

      {/* Dropdown */}
      {isFocused && (query || results.trending.length > 0) && (
        <div className="absolute top-full mt-2 w-full rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
          
          {query && (
            <div className="flex border-b border-ts-border bg-ts-surface-2/50">
              <button onClick={() => setActiveTab("posts")} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${activeTab === "posts" ? "text-ts-primary border-b-2 border-ts-primary bg-ts-surface" : "text-ts-muted hover:text-ts-text"}`}>Posts</button>
              <button onClick={() => setActiveTab("users")} className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${activeTab === "users" ? "text-ts-primary border-b-2 border-ts-primary bg-ts-surface" : "text-ts-muted hover:text-ts-text"}`}>Users</button>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto">
            {!query && results.trending.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] font-bold text-ts-muted uppercase px-2 py-1 tracking-wider">🔥 Trending</p>
                {results.trending.map(t => (
                  <Link key={t._id} href={`/search?q=%23${t._id}`} className="block px-3 py-1.5 text-sm hover:bg-ts-surface-2 rounded-ts-sm text-ts-primary transition-colors">
                    #{t._id} <span className="text-ts-muted text-[10px] ml-1">({t.count})</span>
                  </Link>
                ))}
              </div>
            )}
            
            {query && activeTab === "posts" && results.posts?.map(p => (
              <Link key={p.id} href={`/#post-${p.id}`} className="block p-3 border-b border-ts-border last:border-0 hover:bg-ts-surface-2 transition-colors">
                <p className="text-sm line-clamp-2">{p.content}</p>
                <p className="text-[10px] text-ts-muted mt-1">By {p.authorName}</p>
              </Link>
            ))}

            {query && activeTab === "users" && results.users?.map(u => (
              <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 p-3 border-b border-ts-border last:border-0 hover:bg-ts-surface-2 transition-colors">
                <UserAvatar name={u.name} role={u.role} avatarUrl={u.avatarUrl} size={32} />
                <div>
                  <p className="text-sm font-semibold">{u.name}</p>
                  <p className="text-[10px] text-ts-muted truncate">{u.bio || "No bio"}</p>
                </div>
              </Link>
            ))}

            {loading && <div className="p-4 text-center text-xs text-ts-muted animate-pulse">Searching...</div>}
          </div>
        </div>
      )}
    </div>
  );
}

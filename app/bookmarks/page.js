"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/shared/LanguageProvider";

export default function BookmarksPage() {
  const { tr } = useLang();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then(res => {
        if (res.status === 401) { router.push("/login"); return null; }
        return res.json();
      })
      .then(data => {
        if (data) setPosts(data.items || []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="text-center py-10 text-ts-muted">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Saved Posts</h1>
      {posts.length === 0 ? (
        <div className="rounded-ts border border-dashed border-ts-border bg-ts-surface p-8 text-center text-sm text-ts-muted">
          You haven't saved any posts yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map(p => (
            <li key={p._id} className="rounded-ts border border-ts-border bg-ts-surface p-4 shadow-ts-1">
               <p className="text-sm">{p.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserAvatar from "@/components/shared/UserAvatar";

export default function ProfileFollowers({ userId }) {
  const [data, setData] = useState({ followers: [], followerCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}/followers`)
      .then(res => res.json())
      .then(d => {
        if (d && d.followers) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-4 animate-pulse">
        <div className="h-4 w-32 bg-ts-surface-2 rounded mb-3"></div>
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-full bg-ts-surface-2"></div>
          <div className="h-10 w-10 rounded-full bg-ts-surface-2"></div>
          <div className="h-10 w-10 rounded-full bg-ts-surface-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-5 shadow-ts-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">
          Followers <span className="text-ts-primary">({data.followerCount})</span>
        </h2>
        <p className="text-xs text-ts-muted">Following {data.followingCount}</p>
      </div>
      
      {data.followers.length === 0 ? (
        <p className="text-sm text-ts-muted text-center py-2">No followers yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {data.followers.map(f => (
            <li key={f.id}>
              <Link href={`/profile/${f.id}`} className="group flex flex-col items-center gap-1.5 w-16" title={f.name}>
                <UserAvatar name={f.name} role={f.role} avatarUrl={f.avatarUrl} size={48} />
                <p className="text-[10px] text-ts-muted group-hover:text-ts-text text-center truncate w-full transition-colors">{f.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

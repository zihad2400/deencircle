import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getDb } from "@/lib/mongodb/connection";
import AdminPostForm from "@/components/admin/AdminPostForm";
import AdminPostsList from "@/components/admin/AdminPostsList";
import UserAvatar from "@/components/shared/UserAvatar";

async function AdminStats() {
  await connection();
  
  const db = await getDb();
  const [users, posts, comments, reactions, pendingReports, recentUsers, recentComments] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("posts").countDocuments({ status: "published" }),
    db.collection("comments").countDocuments({ deletedAt: null }),
    db.collection("reactions").countDocuments(),
    db.collection("contentReports").countDocuments({ status: "pending" }),
    db.collection("users").find({}).sort({ createdAt: -1 }).limit(5).toArray(),
    db.collection("comments").find({ deletedAt: null }).sort({ createdAt: -1 }).limit(5).toArray()
  ]);

  const stats = [
    { label: "Total Users", value: users, icon: "👥", color: "text-blue-500" },
    { label: "Published Posts", value: posts, icon: "📝", color: "text-green-500" },
    { label: "Comments", value: comments, icon: "💬", color: "text-purple-500" },
    { label: "Reactions", value: reactions, icon: "❤️", color: "text-rose-500" },
  ];

  return (
    <div className="space-y-8">
      
      {/* Pending Reports Alert */}
      {pendingReports > 0 && (
        <Link href="/admin/moderation" className="block rounded-ts-lg border border-amber-500/30 bg-amber-500/10 p-4 hover:bg-amber-500/20 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Pending Reports</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80">You have {pendingReports} reports awaiting review.</p>
            </div>
            <span className="ml-auto rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">{pendingReports}</span>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-ts-lg border border-ts-border bg-ts-surface p-5 shadow-ts-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ts-muted">{s.label}</p>
              <span className={`text-xl ${s.color}`}>{s.icon}</span>
            </div>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Users */}
        <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-5 shadow-ts-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">New Users</h3>
            <Link href="/admin/users" className="text-xs text-ts-primary hover:underline">View All</Link>
          </div>
          <ul className="space-y-3">
            {recentUsers.map(u => (
              <li key={String(u._id)} className="flex items-center gap-3">
                <UserAvatar name={u.displayName} role={u.role} avatarUrl={u.avatarUrl} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.displayName}</p>
                  <p className="text-xs text-ts-muted truncate">{u.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Comments */}
        <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-5 shadow-ts-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Comments</h3>
          </div>
          <ul className="space-y-3">
            {recentComments.map(c => (
              <li key={String(c._id)} className="flex flex-col gap-1 border-b border-ts-border last:border-0 pb-2">
                <p className="text-xs font-semibold">{c.authorName}</p>
                <p className="text-sm text-ts-muted truncate">{c.content}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-ts-lg border border-ts-border bg-ts-surface p-5">
            <div className="h-3 w-20 bg-ts-surface-2 rounded mb-3"></div>
            <div className="h-8 w-12 bg-ts-surface-2 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-ts-muted mt-1">Overview of your platform's activity.</p>
      </div>

      {/* Stats & Activity */}
      <Suspense fallback={<StatsSkeleton />}>
        <AdminStats />
      </Suspense>

      {/* Create New Post */}
      <section className="rounded-ts-lg border border-ts-border bg-ts-surface p-5 shadow-ts-1">
        <h2 className="text-lg font-semibold mb-4">Create New Post</h2>
        <AdminPostForm />
      </section>

      {/* All Posts */}
      <section className="rounded-ts-lg border border-ts-border bg-ts-surface p-5 shadow-ts-1">
        <h2 className="text-lg font-semibold mb-4">All Posts</h2>
        <AdminPostsList />
      </section>
    </div>
  );
}

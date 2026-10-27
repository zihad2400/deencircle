import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getDb } from "@/lib/mongodb/connection";
import AdminPostForm from "@/components/admin/AdminPostForm";
import AdminPostsList from "@/components/admin/AdminPostsList";

// ডেটাবেস থেকে কাউন্ট আনার জন্য আলাদা অ্যাসিংক কম্পোনেন্ট
async function AdminStats() {
  // Next.js 16 এ dynamic data access নিশ্চিত করা (কোনো dynamic export ছাড়া)
  await connection();
  
  const db = await getDb();
  const [users, posts, comments, reactions, pendingReports] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("posts").countDocuments(),
    db.collection("comments").countDocuments({ deletedAt: null }),
    db.collection("reactions").countDocuments(),
    db.collection("contentReports").countDocuments({ status: "pending" }),
  ]);

  const stats = [
    { label: "Users", value: users },
    { label: "Posts", value: posts },
    { label: "Comments", value: comments },
    { label: "Reactions", value: reactions },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 flex-wrap">
        <Link href="/admin/moderation" className="rounded-ts-sm border border-ts-border px-3 py-1.5 text-sm hover:bg-ts-surface-2 transition-colors flex items-center gap-1">
          🛡️ Moderation {pendingReports > 0 && <span className="rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{pendingReports}</span>}
        </Link>
        <Link href="/admin/users" className="rounded-ts-sm border border-ts-border px-3 py-1.5 text-sm hover:bg-ts-surface-2 transition-colors flex items-center gap-1">
          👥 Users
        </Link>
      </nav>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <li key={s.label} className="rounded-ts border border-ts-border bg-ts-surface p-4 shadow-ts-1">
            <p className="text-xs text-ts-muted uppercase tracking-wider">{s.label}</p>
            <p className="text-3xl font-semibold mt-1">{s.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// স্কেলেটন লোডার
function StatsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-2">
        <div className="h-8 w-32 bg-ts-surface-2 rounded-ts-sm"></div>
        <div className="h-8 w-24 bg-ts-surface-2 rounded-ts-sm"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-ts border border-ts-border bg-ts-surface p-4">
            <div className="h-3 w-16 bg-ts-surface-2 rounded mb-3"></div>
            <div className="h-8 w-12 bg-ts-surface-2 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// মূল পেজ
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      
      <Suspense fallback={<StatsSkeleton />}>
        <AdminStats />
      </Suspense>

      <section className="rounded-ts-lg border border-ts-border bg-ts-surface p-4 shadow-ts-1">
        <h2 className="text-lg font-semibold mb-3">Create New Post</h2>
        <AdminPostForm />
      </section>

      <section className="rounded-ts-lg border border-ts-border bg-ts-surface p-4 shadow-ts-1">
        <h2 className="text-lg font-semibold mb-3">All Posts</h2>
        <AdminPostsList />
      </section>
    </div>
  );
}

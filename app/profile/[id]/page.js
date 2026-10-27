import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { getDb } from "@/lib/mongodb/connection";
import UserAvatar from "@/components/shared/UserAvatar";

export default async function ProfilePage({ params }) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(id) },
    { projection: { email: 1, displayName: 1, role: 1, bio: 1, avatarUrl: 1, createdAt: 1 } }
  );
  if (!user) notFound();

  const [commentCount, reactionCount, bookmarkCount, userComments] = await Promise.all([
    db.collection("comments").countDocuments({ authorId: user._id, deletedAt: null }),
    db.collection("reactions").countDocuments({ userId: user._id }),
    db.collection("bookmarks").countDocuments({ userId: user._id }),
    db.collection("comments").find({ authorId: user._id, deletedAt: null }).sort({createdAt: -1}).limit(5).toArray()
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Profile Header Card */}
      <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-6 sm:p-8 shadow-ts-1 relative overflow-hidden">
        {/* Banner */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-ts-primary-soft to-ts-surface-2"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 mt-8">
          <UserAvatar name={user.displayName} role={user.role} avatarUrl={user.avatarUrl} size={80} />
          <div className="text-center sm:text-left flex-1 mt-2">
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            <p className="text-sm text-ts-muted">{user.email}</p>
            {user.bio && <p className="mt-2 text-sm max-w-lg">{user.bio}</p>}
            <p className="text-xs text-ts-muted mt-2">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          <div className="rounded-ts bg-ts-surface-2 p-3 text-center">
            <p className="text-2xl font-bold">{commentCount}</p>
            <p className="text-xs text-ts-muted uppercase tracking-wider">Comments</p>
          </div>
          <div className="rounded-ts bg-ts-surface-2 p-3 text-center">
            <p className="text-2xl font-bold">{reactionCount}</p>
            <p className="text-xs text-ts-muted uppercase tracking-wider">Reactions</p>
          </div>
          <div className="rounded-ts bg-ts-surface-2 p-3 text-center">
            <p className="text-2xl font-bold">{bookmarkCount}</p>
            <p className="text-xs text-ts-muted uppercase tracking-wider">Saved</p>
          </div>
        </div>
      </div>

      {/* Recent Activity (Comments) */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold px-2">Recent Comments</h2>
        {userComments.length === 0 ? (
          <p className="text-sm text-ts-muted p-4 border border-dashed rounded-ts text-center">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {userComments.map(c => (
              <li key={c._id} className="rounded-ts border border-ts-border bg-ts-surface p-4">
                <p className="text-xs text-ts-muted mb-1">
                  Commented on a post · {new Date(c.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm">{c.content}</p>
                <Link href={`/#post-${c.postId}`} className="text-xs text-ts-primary mt-2 inline-block hover:underline">
                  View Post →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

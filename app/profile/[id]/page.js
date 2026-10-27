import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { getDb } from "@/lib/mongodb/connection";
import UserAvatar from "@/components/shared/UserAvatar";
import FollowButton from "@/components/shared/FollowButton";
import ProfileFollowers from "@/components/profile/ProfileFollowers";

export default async function ProfilePage({ params }) {
  await connection();
  
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  if (!id || !ObjectId.isValid(id)) notFound();

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
      
      {/* Profile Card */}
      <div className="rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-1 relative overflow-hidden">
        
        {/* Cover Banner */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:16px_16px]"></div>
        </div>

        {/* Profile Info */}
        <div className="px-6 sm:px-8 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16 relative z-10">
            
            {/* Avatar with border */}
            <div className="rounded-full border-4 border-ts-surface bg-ts-surface shadow-ts-2">
              <UserAvatar name={user.displayName} role={user.role} avatarUrl={user.avatarUrl} size={100} />
            </div>

            {/* Name & Bio */}
            <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0 sm:mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center sm:justify-start gap-2">
                {user.displayName}
                {user.role === "admin" && (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs bg-white text-red-600 px-2.5 py-0.5 rounded-full font-bold border border-red-200 shadow-sm ml-1">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Admin
                </span>
              )}
              </h1>
              <p className="text-sm text-ts-muted">{user.email}</p>
            </div>

            {/* Follow / Edit Profile */}
            <div className="sm:mb-2">
              <FollowButton targetUserId={String(user._id)} />
            </div>
          </div>

          {/* Bio */}
          {user.bio && <p className="mt-4 text-sm text-ts-text max-w-lg text-center sm:text-left mx-auto sm:mx-0">{user.bio}</p>}
          
          {/* Joined Date */}
          <p className="text-xs text-ts-muted mt-2 text-center sm:text-left">
            📅 Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-6 max-w-md mx-auto sm:mx-0">
            <div className="rounded-ts bg-ts-surface-2 p-3 text-center">
              <p className="text-xl font-bold">{commentCount}</p>
              <p className="text-[10px] text-ts-muted uppercase tracking-wider font-semibold">Comments</p>
            </div>
            <div className="rounded-ts bg-ts-surface-2 p-3 text-center">
              <p className="text-xl font-bold">{reactionCount}</p>
              <p className="text-[10px] text-ts-muted uppercase tracking-wider font-semibold">Reactions</p>
            </div>
            <div className="rounded-ts bg-ts-surface-2 p-3 text-center">
              <p className="text-xl font-bold">{bookmarkCount}</p>
              <p className="text-[10px] text-ts-muted uppercase tracking-wider font-semibold">Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Followers Section (Client Component) */}
      <ProfileFollowers userId={String(user._id)} />

      {/* Recent Comments */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold px-2">Recent Comments</h2>
        {userComments.length === 0 ? (
          <p className="text-sm text-ts-muted p-4 border border-dashed rounded-ts text-center">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {userComments.map(c => (
              <li key={String(c._id)} className="rounded-ts border border-ts-border bg-ts-surface p-4 hover:bg-ts-surface-2 transition-colors">
                <p className="text-xs text-ts-muted mb-1">Commented · {new Date(c.createdAt).toLocaleDateString()}</p>
                <p className="text-sm">{c.content}</p>
                <Link href={`/#post-${c.postId}`} className="text-xs text-ts-primary mt-2 inline-block hover:underline">View Post →</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

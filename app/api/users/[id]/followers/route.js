import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    const userId = new ObjectId(id);

    const db = await getDb();
    
    const [followers, following] = await Promise.all([
      db.collection("follows").find({ followingId: userId }).toArray(),
      db.collection("follows").find({ followerId: userId }).toArray()
    ]);

    // Followers-দের সম্পূর্ণ ডেটা আনা
    const followerIds = followers.map(f => f.followerId);
    const followerUsers = await db.collection("users")
      .find({ _id: { $in: followerIds } }, { projection: { displayName: 1, avatarUrl: 1, role: 1 } })
      .limit(10)
      .toArray();

    return NextResponse.json({
      followerCount: followers.length,
      followingCount: following.length,
      followers: followerUsers.map(u => ({
        id: String(u._id),
        name: u.displayName,
        role: u.role,
        avatarUrl: u.avatarUrl
      }))
    });
  } catch (e) {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

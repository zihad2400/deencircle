import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createNotification } from "@/lib/services/notifications";

// POST: Follow / Unfollow (Toggle)
export async function POST(req, { params }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    
    const targetUserId = new ObjectId(id);
    if (me._id.equals(targetUserId)) {
      return NextResponse.json({ error: "cannot_follow_self" }, { status: 400 });
    }

    const db = await getDb();
    const targetUser = await db.collection("users").findOne({ _id: targetUserId });
    if (!targetUser) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

    // চেক করা: আমি কি ইতিমধ্যে ফলো করেছি?
    const existingFollow = await db.collection("follows").findOne({
      followerId: me._id,
      followingId: targetUserId
    });

    if (existingFollow) {
      // আনফলো করা
      await db.collection("follows").deleteOne({ _id: existingFollow._id });
      return NextResponse.json({ following: false });
    } else {
      // ফলো করা
      await db.collection("follows").insertOne({
        followerId: me._id,
        followingId: targetUserId,
        createdAt: new Date()
      });

      // নোটিফিকেশন পাঠানো
      await createNotification({
        recipientId: targetUserId,
        audience: "user",
        type: "system",
        title: `${me.displayName} started following you`,
        body: "",
        link: `/profile/${me._id}`,
        meta: { followerId: String(me._id) },
      });

      return NextResponse.json({ following: true });
    }
  } catch (e) {
    console.error("[follow POST]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

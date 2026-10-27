import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { reactionSchema, parseOrThrow } from "@/lib/validation/schemas";
import { createNotification, notifyAllAdmins } from "@/lib/services/notifications";

export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    const postId = new ObjectId(id);
    const body = await req.json();
    const data = parseOrThrow(reactionSchema, body);

    const db = await getDb();
    const post = await db.collection("posts").findOne({ _id: postId }, { projection: { authorId: 1, authorName: 1 } });
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const now = new Date();
    const result = await db.collection("reactions").updateOne(
      { postId, userId: user._id },
      { $set: { type: data.type, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    if (result.upsertedId && post.authorId && String(post.authorId) !== String(user._id)) {
      await createNotification({
        recipientId: post.authorId,
        audience: "admin",
        type: "reaction",
        title: `${user.displayName} reacted to your post`,
        body: data.type,
        link: `/#post-${id}`,
        meta: { postId: id, actorId: String(user._id) },
      });
    }

    if (result.upsertedId) {
      await notifyAllAdmins({
        type: "reaction",
        title: `${user.displayName} reacted to a post`,
        body: `Reaction: ${data.type}`,
        link: `/#post-${id}`,
        meta: { postId: id, actorId: String(user._id) },
      });
    }

    return NextResponse.json({ ok: true, type: data.type });
  } catch (e) {
    if (e.status === 400) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    console.error("[reactions]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    
    const db = await getDb();
    const result = await db.collection("reactions").deleteOne({ 
      postId: new ObjectId(id), 
      userId: user._id 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reactions DELETE]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

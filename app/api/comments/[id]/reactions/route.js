import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { reactionSchema, parseOrThrow } from "@/lib/validation/schemas";

export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    const commentId = new ObjectId(id);
    
    const body = await req.json();
    const data = parseOrThrow(reactionSchema, body);

    const db = await getDb();
    const comment = await db.collection("comments").findOne({ _id: commentId });
    if (!comment) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // আপসার্ট (যদি আগে থেকে থাকে তবে আপডেট হবে, না থাকলে নতুন হবে)
    await db.collection("commentReactions").updateOne(
      { commentId, userId: user._id },
      { $set: { type: data.type, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, type: data.type });
  } catch (e) {
    if (e.status === 400) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    console.error("[comment reactions]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  try {
    const { id } = await params;
    const db = await getDb();
    await db.collection("commentReactions").deleteOne({ 
      commentId: new ObjectId(id), 
      userId: user._id 
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function PATCH(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    const body = await req.json();
    if (typeof body.content !== "string" || !body.content.trim()) {
      return NextResponse.json({ error: "empty" }, { status: 400 });
    }
    const db = await getDb();
    const r = await db.collection("comments").updateOne(
      { _id: new ObjectId(id), authorId: user._id },
      { $set: { content: body.content.trim().slice(0, 2000), updatedAt: new Date(), edited: true } }
    );
    if (r.matchedCount === 0) return NextResponse.json({ error: "not_found_or_forbidden" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
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
    
    // শুধুমাত্র নিজের কমেন্ট অথবা অ্যাডমিন ডিলিট করতে পারবে
    const filter = user.role === "admin"
      ? { _id: new ObjectId(id) }
      : { _id: new ObjectId(id), authorId: user._id };
    
    const r = await db.collection("comments").updateOne(
      filter,
      { $set: { deletedAt: new Date(), content: "[deleted]" } }
    );
    
    if (r.matchedCount === 0) return NextResponse.json({ error: "not_found_or_forbidden" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

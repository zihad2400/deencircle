import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function DELETE(req, { params }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    
    const otherUserId = new ObjectId(id);
    const db = await getDb();
    
    // শুধু নিজের এবং অন্য ইউজারের মধ্যকার মেসেজগুলো ডিলিট করা
    const result = await db.collection("messages").deleteMany({
      $or: [
        { from: me._id, to: otherUserId },
        { from: otherUserId, to: me._id }
      ]
    });

    return NextResponse.json({ ok: true, deletedCount: result.deletedCount });
  } catch (e) {
    console.error("[messages DELETE]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function DELETE(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });

    const db = await getDb();
    const result = await db.collection("notifications").deleteOne({
      _id: new ObjectId(id),
      recipientId: user._id, // শুধু নিজের নোটিফিকেশন ডিলিট করতে পারবে
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

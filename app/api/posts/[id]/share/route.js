import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    
    const db = await getDb();
    const r = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { shareCount: 1 } } // Increment share count by 1
    );
    if (r.matchedCount === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[share POST]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

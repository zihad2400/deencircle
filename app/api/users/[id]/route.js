import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    
    const db = await getDb();
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { displayName: 1, avatarUrl: 1, role: 1, bio: 1 } }
    );
    if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
    
    return NextResponse.json({
      user: { id: String(user._id), name: user.displayName, avatarUrl: user.avatarUrl, role: user.role, bio: user.bio }
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

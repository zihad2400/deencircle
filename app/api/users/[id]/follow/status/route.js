import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(req, { params }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ following: false });

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ following: false });
    
    const db = await getDb();
    const existing = await db.collection("follows").findOne({
      followerId: me._id,
      followingId: new ObjectId(id)
    });
    
    return NextResponse.json({ following: !!existing });
  } catch {
    return NextResponse.json({ following: false });
  }
}

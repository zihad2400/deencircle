import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// GET: Fetch user's saved posts
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = await getDb();
  const bookmarks = await db.collection("bookmarks").find({ userId: user._id }).toArray();
  const postIds = bookmarks.map(b => b.postId);

  if (postIds.length === 0) return NextResponse.json({ items: [] });

  const posts = await db.collection("posts").find({ _id: { $in: postIds } }).toArray();
  
  // Reuse the same aggregation logic or fetch minimal data for saved posts
  // For simplicity here, returning raw posts. In a real app, you'd format it exactly like the feed.
  return NextResponse.json({ items: posts });
}

// POST: Toggle bookmark (Add/Remove)
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { postId } = await req.json();
    if (!ObjectId.isValid(postId)) return NextResponse.json({ error: "bad_id" }, { status: 400 });

    const db = await getDb();
    const existing = await db.collection("bookmarks").findOne({
      userId: user._id,
      postId: new ObjectId(postId)
    });

    if (existing) {
      // Remove bookmark
      await db.collection("bookmarks").deleteOne({ _id: existing._id });
      return NextResponse.json({ saved: false });
    } else {
      // Add bookmark
      await db.collection("bookmarks").insertOne({
        userId: user._id,
        postId: new ObjectId(postId),
        createdAt: new Date()
      });
      return NextResponse.json({ saved: true });
    }
  } catch (e) {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

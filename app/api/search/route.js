import { NextResponse, connection } from "next/server";
import { getDb } from "@/lib/mongodb/connection";

export async function GET(req) {
  await connection();
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const type = url.searchParams.get("type") || "posts";
    
    const db = await getDb();
    let results = [];

    if (!q) {
      // Trending Hashtags if no query
      const hashtags = await db.collection("posts").aggregate([
        { $match: { status: "published" } },
        { $unwind: "$hashtags" },
        { $group: { _id: "$hashtags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
      return NextResponse.json({ trending: hashtags });
    }

    if (type === "users") {
      results = await db.collection("users").find({
        $or: [
          { displayName: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } }
        ],
        status: "active"
      }, { projection: { displayName: 1, avatarUrl: 1, role: 1, bio: 1 } })
      .limit(20).toArray();
      
      return NextResponse.json({ 
        users: results.map(u => ({
          id: String(u._id), name: u.displayName, role: u.role, avatarUrl: u.avatarUrl, bio: u.bio
        }))
      });
    }

    // Default: Search Posts
    results = await db.collection("posts").find({
      content: { $regex: q, $options: "i" },
      status: "published"
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();
    
    return NextResponse.json({ 
      posts: results.map(p => ({
        id: String(p._id), content: p.content, authorName: p.authorName, createdAt: p.createdAt
      }))
    });
  } catch (e) {
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}

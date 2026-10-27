import { NextResponse, connection } from "next/server";
import { getDb } from "@/lib/mongodb/connection";

export async function GET(req) {
  await connection(); // Ensure dynamic rendering
  
  try {
    const db = await getDb();
    
    // ১. ট্রেন্ডিং পোস্ট (সবচেয়ে বেশি রিঅ্যাকশন পাওয়া)
    const topPosts = await db.collection("posts").aggregate([
      { $match: { status: "published" } },
      { $lookup: { from: "reactions", localField: "_id", foreignField: "postId", as: "rs" } },
      { $addFields: { reactionCount: { $size: "$rs" } } },
      { $project: { rs: 0 } },
      { $sort: { reactionCount: -1, createdAt: -1 } },
      { $limit: 5 }
    ]).toArray();

    // ২. সাজেস্টেড ইউজার (সর্বশেষ যোগ দেওয়া ইউজার)
    const suggestedUsers = await db.collection("users")
      .find({ status: "active" }, { projection: { displayName: 1, avatarUrl: 1, role: 1, bio: 1, email: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({ 
      topPosts: topPosts.map(p => ({
        id: String(p._id),
        content: p.content.substring(0, 100) + "...",
        authorName: p.authorName,
        reactionCount: p.reactionCount
      })), 
      suggestedUsers: suggestedUsers.map(u => ({
        id: String(u._id),
        name: u.displayName,
        role: u.role,
        avatarUrl: u.avatarUrl,
        bio: u.bio
      }))
    }, {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (e) {
    console.error("[explore GET]", e);
    return NextResponse.json({ error: "explore_unavailable" }, { status: 500 });
  }
}

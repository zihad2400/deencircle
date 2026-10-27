import { NextResponse, connection } from "next/server";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { postCreateSchema, parseOrThrow } from "@/lib/validation/schemas";
import { createNotification } from "@/lib/services/notifications";

export async function GET(req) {
  await connection();
  
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "published";
    const feedType = url.searchParams.get("feed") || "all"; // "all" অথবা "following"
    const q = (url.searchParams.get("q") || "").trim();
    const sort = url.searchParams.get("sort") || "newest";
    const limit = Math.min(Number(url.searchParams.get("limit") || 10), 50);

    const me = await getCurrentUser();
    const db = await getDb();
    const coll = db.collection("posts");

    let match = { status };
    if (q) match.content = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    // ⚠️ ফিল্টারিং: Following ফিড
    if (feedType === "following" && me) {
      const follows = await db.collection("follows")
        .find({ followerId: me._id })
        .toArray();
      const followingIds = follows.map(f => f.followingId);
      
      // সব পোস্ট যেগুলো ফলো করা ইউজারদের অথবা নিজের
      match.authorId = { $in: [...followingIds, me._id] };
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "author"
        }
      },
      { $addFields: { authorAvatar: { $arrayElemAt: ["$author.avatarUrl", 0] } } },
      {
        $lookup: {
          from: "reactions",
          localField: "_id",
          foreignField: "postId",
          as: "reactions_data"
        }
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments_data",
          pipeline: [{ $match: { deletedAt: null } }]
        }
      },
      {
        $addFields: {
          reactionCount: { $size: "$reactions_data" },
          commentCount: { $size: "$comments_data" },
          myReaction: {
            $let: {
              vars: {
                matched: {
                  $filter: {
                    input: "$reactions_data",
                    as: "r",
                    cond: { $eq: ["$$r.userId", me ? me._id : null] }
                  }
                }
              },
              in: { $arrayElemAt: ["$$matched.type", 0] }
            }
          }
        }
      },
      { $project: { reactions_data: 0, comments_data: 0, author: 0 } }
    ];

    if (sort === "top") {
      pipeline.push({ $sort: { pinned: -1, reactionCount: -1, publishedAt: -1 } });
    } else {
      pipeline.push({ $sort: { pinned: -1, publishedAt: -1, createdAt: -1 } });
    }
    pipeline.push({ $limit: limit });

    const posts = await coll.aggregate(pipeline).toArray();
    return NextResponse.json({ posts }, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch (e) {
    console.error("[posts GET]", e);
    return NextResponse.json({ error: "feed_unavailable", detail: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const data = parseOrThrow(postCreateSchema, body);
    const db = await getDb();
    const now = new Date();
    // Extract hashtags from content
    const hashtags = (data.content.match(/#[\w\u0980-\u09FF]+/g) || []).map(h => h.slice(1).toLowerCase());
    
    const doc = {
      content: data.content,
      hashtags: hashtags, status: data.status, pinned: data.pinned,
      authorId: user._id, authorName: user.displayName,
      createdAt: now, updatedAt: now,
      publishedAt: data.status === "published" ? now : null,
      edited: false, shareCount: 0
    };
    const res = await db.collection("posts").insertOne(doc);

    if (data.status === "published") {
      const recipients = await db.collection("users")
        .find({ role: "user", status: "active" }, { projection: { _id: 1 } })
        .toArray();
      await Promise.all(recipients.map((r) => createNotification({
        recipientId: r._id, audience: "user", type: "post_published",
        title: `${user.displayName} published a new post`,
        body: data.content.slice(0, 80),
        link: `/#post-${res.insertedId}`,
        meta: { postId: String(res.insertedId) },
      })));
    }
    return NextResponse.json({ ok: true, id: String(res.insertedId) }, { status: 201 });
  } catch (e) {
    if (e.status === 400) return NextResponse.json({ error: "validation_failed", issues: e.issues }, { status: 400 });
    console.error("[posts POST]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

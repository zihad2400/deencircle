import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { commentCreateSchema, parseOrThrow } from "@/lib/validation/schemas";
import { createNotification, notifyAllAdmins } from "@/lib/services/notifications";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    
    const me = await getCurrentUser();
    const db = await getDb();
    
    const pipeline = [
      // ⚠️ deletedAt: null চেক করা হয়েছে
      { $match: { postId: new ObjectId(id), deletedAt: null } },
      { $lookup: { from: "commentReactions", localField: "_id", foreignField: "commentId", as: "rs" } },
      {
        $addFields: {
          reactionCount: { $size: "$rs" },
          myReaction: {
            $let: {
              vars: {
                matched: {
                  $filter: {
                    input: "$rs", as: "r",
                    cond: { $eq: ["$$r.userId", me ? me._id : null] }
                  }
                }
              },
              in: { $arrayElemAt: ["$$matched.type", 0] }
            }
          }
        }
      },
      { $project: { rs: 0 } },
      { $sort: { createdAt: 1 } },
      { $limit: 200 }
    ];

    const items = await db.collection("comments").aggregate(pipeline).toArray();

    const shaped = items.map((c) => ({
      id: String(c._id),
      postId: String(c.postId),
      parentId: c.parentId ? String(c.parentId) : null,
      authorId: String(c.authorId),
      authorName: c.authorName,
      content: c.content,
      createdAt: c.createdAt,
      reactionCount: c.reactionCount,
      myReaction: c.myReaction,
      role: c.authorId.equals(me?._id) ? me.role : "user",
      isOwn: me ? c.authorId.equals(me._id) : false,
      canDelete: me ? (c.authorId.equals(me._id) || me.role === "admin") : false,
    }));
    
    return NextResponse.json({ comments: shaped });
  } catch (e) {
    console.error("[comments GET]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    const postId = new ObjectId(id);
    const body = await req.json();
    const data = parseOrThrow(commentCreateSchema, body);
    
    const db = await getDb();
    const post = await db.collection("posts").findOne({ _id: postId }, { projection: { _id: 1 } });
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

    let parent = null;
    if (data.parentId) {
      if (!ObjectId.isValid(data.parentId)) return NextResponse.json({ error: "bad_parent" }, { status: 400 });
      parent = await db.collection("comments").findOne(
        { _id: new ObjectId(data.parentId), postId },
        { projection: { authorId: 1, authorName: 1 } }
      );
      if (!parent) return NextResponse.json({ error: "bad_parent" }, { status: 400 });
    }

    const now = new Date();
    const doc = {
      postId,
      parentId: data.parentId ? new ObjectId(data.parentId) : null,
      authorId: user._id,
      authorName: user.displayName,
      content: data.content,
      createdAt: now,
      updatedAt: now,
      edited: false,
      deletedAt: null,
      moderationStatus: "visible",
    };
    const r = await db.collection("comments").insertOne(doc);

    if (parent && String(parent.authorId) !== String(user._id)) {
      await createNotification({
        recipientId: parent.authorId,
        audience: parent.authorId.equals(user._id) ? "admin" : "user",
        type: "comment_reply",
        title: `${user.displayName} replied to you`,
        body: data.content.slice(0, 80),
        link: `/#post-${id}`,
        meta: { postId: id, commentId: String(r.insertedId), actorId: String(user._id) },
      });
    }

    await notifyAllAdmins({
      type: "comment_reply",
      title: `New comment on a post`,
      body: `${user.displayName}: ${data.content.slice(0, 60)}...`,
      link: `/#post-${id}`,
      meta: { postId: id, commentId: String(r.insertedId), actorId: String(user._id) },
    });
    
    return NextResponse.json({ ok: true, id: String(r.insertedId) }, { status: 201 });
  } catch (e) {
    if (e.status === 400) return NextResponse.json({ error: "validation_failed", issues: e.issues }, { status: 400 });
    console.error("[comments POST]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

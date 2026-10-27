import { NextResponse, connection } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createNotification } from "@/lib/services/notifications";

export async function GET(req) {
  await connection();
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const withUser = url.searchParams.get("with");
  const search = url.searchParams.get("search");
  
  const db = await getDb();
  
  // ইউজার সার্চ
  if (search !== null) {
    const users = await db.collection("users").find({
      _id: { $ne: me._id },
      $or: [
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ],
      status: "active"
    }, { projection: { displayName: 1, avatarUrl: 1, role: 1 } })
    .limit(10)
    .toArray();
    
    return NextResponse.json({
      users: users.map(u => ({
        id: String(u._id), name: u.displayName, avatarUrl: u.avatarUrl, role: u.role
      }))
    });
  }
  
  // নির্দিষ্ট ইউজারের সাথে চ্যাট
  if (withUser) {
    if (!ObjectId.isValid(withUser)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    
    const messages = await db.collection("messages").find({
      $or: [
        { from: me._id, to: new ObjectId(withUser) },
        { from: new ObjectId(withUser), to: me._id }
      ]
    }).sort({ createdAt: 1 }).toArray();

    const unreadIds = messages
      .filter(m => !m.read && String(m.to) === String(me._id))
      .map(m => m._id);

    if (unreadIds.length > 0) {
      await db.collection("messages").updateMany(
        { _id: { $in: unreadIds } },
        { $set: { read: true, readAt: new Date() } }
      );

      // 🧹 চ্যাট ওপেন করলে সেই ইউজারের পাঠানো মেসেজ নোটিফিকেশন ডিলিট করে দাও
      await db.collection("notifications").deleteMany({
        recipientId: me._id,
        type: "message",
        "meta.senderId": String(withUser)
      });
    }

    return NextResponse.json({
      messages: messages.map(m => ({
        id: String(m._id),
        from: String(m.from),
        to: String(m.to),
        content: m.content,
        type: m.type || "text",
        meta: m.meta || null,
        read: m.read || false,
        createdAt: m.createdAt
      }))
    });
  }
  
  // কথোপকথনের তালিকা
  const convos = await db.collection("messages").aggregate([
    { $match: { $or: [{ from: me._id }, { to: me._id }] } },
    { $sort: { createdAt: -1 } },
    { $group: {
      _id: { $cond: [{ $eq: ["$from", me._id] }, "$to", "$from"] },
      lastMessage: { $first: "$content" },
      lastType: { $first: "$type" },
      lastAt: { $first: "$createdAt" },
      unread: { 
        $sum: { 
          $cond: [
            { $and: [
              { $eq: ["$to", me._id] },
              { $eq: ["$read", false] }
            ]},
            1, 0
          ]
        }
      }
    }},
    { $sort: { lastAt: -1 } }
  ]).toArray();

  const userIds = convos.map(c => c._id);
  const users = await db.collection("users").find({ _id: { $in: userIds } }).toArray();
  
  return NextResponse.json({
    conversations: convos.map(c => {
      const u = users.find(x => String(x._id) === String(c._id));
      return {
        userId: String(c._id),
        name: u ? u.displayName : "Unknown",
        avatarUrl: u ? u.avatarUrl : "",
        lastMessage: c.lastType === "image" ? "📷 Image" : c.lastMessage,
        lastAt: c.lastAt,
        unread: c.unread
      };
    })
  });
}

export async function POST(req) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { to, content, type = "text", meta } = body;
  
  if (!to || !content) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  if (!ObjectId.isValid(to)) return NextResponse.json({ error: "bad_to" }, { status: 400 });

  const db = await getDb();
  const recipientId = new ObjectId(to);

  // ১. মেসেজ সেভ
  const doc = {
    from: me._id,
    to: recipientId,
    content: content.trim(),
    type: type,
    meta: meta || null,
    read: false,
    readAt: null,
    createdAt: new Date()
  };
  await db.collection("messages").insertOne(doc);

  // 🔔 ২. স্মার্ট নোটিফিকেশন লজিক
  try {
    // এই প্রেরকের কাছ থেকে আনরিড মেসেজ আছে কিনা চেক
    const unreadCount = await db.collection("messages").countDocuments({
      from: me._id,
      to: recipientId,
      read: false
    });

    // ✅ শুধুমাত্র প্রথম আনরিড মেসেজে নোটিফিকেশন (বারবার নয়)
    if (unreadCount === 1) {
      const sender = await db.collection("users").findOne(
        { _id: me._id }, 
        { projection: { displayName: 1 } }
      );
      
      await createNotification({
        recipientId: recipientId,
        audience: "user",
        type: "message",
        title: `New message from ${sender.displayName}`,
        body: content.length > 50 ? content.slice(0, 50) + "..." : content,
        link: `/messages?with=${me._id}`,
        meta: { senderId: String(me._id) }
      });
    }
  } catch (e) {
    console.error("[notification]", e);
  }

  return NextResponse.json({ ok: true });
}

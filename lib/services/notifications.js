import { getDb } from "@/lib/mongodb/connection";

/**
 * notifications doc shape:
 * {
 *   _id, recipientId (ObjectId), audience: "user" | "admin",
 *   type: "post_published" | "comment_reply" | "reaction" | "system" | "moderation",
 *   title, body, link, read: false, createdAt, readAt: null,
 *   meta: { postId?, commentId?, actorId?, ... }
 * }
 */

export async function createNotification({
  recipientId,
  audience = "user",
  type,
  title,
  body = "",
  link = null,
  meta = {},
}) {
  const db = await getDb();
  const now = new Date();
  const doc = {
    recipientId,
    audience,
    type,
    title,
    body,
    link,
    meta,
    read: false,
    readAt: null,
    createdAt: now,
  };
  const res = await db.collection("notifications").insertOne(doc);
  return { ...doc, _id: res.insertedId };
}

export async function listNotifications({ recipientId, limit = 20, unreadOnly = false }) {
  const db = await getDb();
  const filter = { recipientId };
  if (unreadOnly) filter.read = false;
  return db.collection("notifications")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 50))
    .toArray();
}

export async function countUnread(recipientId) {
  const db = await getDb();
  return db.collection("notifications").countDocuments({ recipientId, read: false });
}

export async function markRead(recipientId, ids) {
  const db = await getDb();
  const { ObjectId } = await import("mongodb");
  const _ids = ids.map((id) => new ObjectId(id));
  await db.collection("notifications").updateMany(
    { _id: { $in: _ids }, recipientId },
    { $set: { read: true, readAt: new Date() } }
  );
}

export async function markAllRead(recipientId) {
  const db = await getDb();
  await db.collection("notifications").updateMany(
    { recipientId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
}

/**
 * Notify all admins (used e.g. when a user reports content).
 */
export async function notifyAllAdmins(payload) {
  const db = await getDb();
  const admins = await db.collection("users")
    .find({ role: "admin", status: "active" }, { projection: { _id: 1 } })
    .toArray();
  await Promise.all(admins.map((a) =>
    createNotification({ ...payload, recipientId: a._id, audience: "admin" })
  ));
}

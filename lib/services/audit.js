import { getDb } from "@/lib/mongodb/connection";

export async function auditLog({ actorId, actorEmail, action, targetType, targetId, details = {} }) {
  const db = await getDb();
  await db.collection("auditLogs").insertOne({
    actorId, actorEmail, action, targetType, targetId,
    details, createdAt: new Date(),
  });
}

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { notifyAllAdmins } from "@/lib/services/notifications";

const schema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3).max(500),
});

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    const { targetType, targetId, reason } = parsed.data;
    if (!ObjectId.isValid(targetId)) return NextResponse.json({ error: "bad_target" }, { status: 400 });

    const db = await getDb();
    const now = new Date();
    const r = await db.collection("contentReports").insertOne({
      targetType, targetId: new ObjectId(targetId),
      reason, reporterId: user._id, reporterEmail: user.email,
      status: "pending", createdAt: now, reviewedAt: null, reviewedBy: null,
    });

    await notifyAllAdmins({
      type: "moderation",
      title: `New ${targetType} report from ${user.displayName}`,
      body: reason.slice(0, 80),
      link: "/admin/moderation",
      meta: { reportId: String(r.insertedId), targetType, targetId },
    });

    return NextResponse.json({ ok: true, id: String(r.insertedId) }, { status: 201 });
  } catch (e) {
    console.error("[reports POST]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

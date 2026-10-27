import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { auditLog } from "@/lib/services/audit";

export async function PATCH(req, { params }) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (actor.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    if (id === String(actor._id)) return NextResponse.json({ error: "self_action_denied" }, { status: 400 });

    const body = await req.json();
    const status = body.status;
    if (!["active", "suspended"].includes(status)) {
      return NextResponse.json({ error: "bad_status" }, { status: 400 });
    }

    const db = await getDb();
    const r = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    if (r.matchedCount === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Invalidate sessions of the suspended user.
    if (status === "suspended") {
      await db.collection("sessions").deleteMany({ userId: new ObjectId(id) });
    }

    await auditLog({
      actorId: actor._id, actorEmail: actor.email,
      action: `user_${status === "suspended" ? "suspend" : "reactivate"}`,
      targetType: "user", targetId: id, details: { status },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin user PATCH]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { auditLog } from "@/lib/services/audit";

async function adminOnly() {
  const user = await getCurrentUser();
  if (!user) return { res: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (user.role !== "admin") return { res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user };
}

export async function PATCH(req, { params }) {
  const { user, res } = await adminOnly();
  if (res) return res;
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    const body = await req.json();
    const action = body.action;
    if (!["approve", "dismiss"].includes(action)) {
      return NextResponse.json({ error: "bad_action" }, { status: 400 });
    }
    const db = await getDb();
    const report = await db.collection("contentReports").findOne({ _id: new ObjectId(id) });
    if (!report) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const status = action === "approve" ? "resolved" : "dismissed";
    await db.collection("contentReports").updateOne(
      { _id: report._id },
      { $set: { status, reviewedAt: new Date(), reviewedBy: user._id } }
    );

    if (action === "approve") {
      if (report.targetType === "post") {
        await db.collection("posts").updateOne(
          { _id: report.targetId },
          { $set: { status: "archived", archivedAt: new Date() } }
        );
      } else if (report.targetType === "comment") {
        await db.collection("comments").updateOne(
          { _id: report.targetId },
          { $set: { deletedAt: new Date(), content: "[removed by moderator]" } }
        );
      }
    }

    await auditLog({
      actorId: user._id, actorEmail: user.email,
      action: `report_${action}`, targetType: report.targetType,
      targetId: String(report.targetId), details: { reportId: id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin report PATCH]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

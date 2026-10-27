import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "pending";
  const db = await getDb();
  const items = await db.collection("contentReports")
    .find({ status })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return NextResponse.json({
    items: items.map((r) => ({
      id: String(r._id),
      targetType: r.targetType,
      targetId: String(r.targetId),
      reason: r.reason,
      reporterEmail: r.reporterEmail,
      status: r.status,
      createdAt: r.createdAt,
    })),
  });
}

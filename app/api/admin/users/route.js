import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const db = await getDb();
  const items = await db.collection("users")
    .find({}, { projection: { email: 1, displayName: 1, role: 1, status: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  return NextResponse.json({
    items: items.map((u) => ({
      id: String(u._id), email: u.email, displayName: u.displayName,
      role: u.role, status: u.status, createdAt: u.createdAt,
    })),
  });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { markRead, markAllRead } from "@/lib/services/notifications";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.all) {
    await markAllRead(user._id);
    return NextResponse.json({ ok: true });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "no_ids" }, { status: 400 });
  await markRead(user._id, ids);
  return NextResponse.json({ ok: true });
}

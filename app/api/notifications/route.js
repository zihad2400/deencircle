import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { listNotifications, countUnread } from "@/lib/services/notifications";

export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
  const unreadOnly = url.searchParams.get("unread") === "1";

  const [items, unread] = await Promise.all([
    listNotifications({ recipientId: user._id, limit, unreadOnly }),
    countUnread(user._id),
  ]);

  return NextResponse.json({
    items: items.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt,
    })),
    unread,
  });
}

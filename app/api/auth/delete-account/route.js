import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function DELETE(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const db = await getDb();
    
    // ⚠️ অ্যাডমিন অ্যাকাউন্ট ডিলিট করা যাবে না (নিরাপত্তার জন্য)
    if (user.role === "admin") {
      return NextResponse.json({ error: "admin_cannot_delete" }, { status: 403 });
    }

    // ১. ইউজারের সব ডেটা ডিলিট (ব্যাকগ্রাউন্ডে সব কালেকশন পরিষ্কার)
    await Promise.all([
      db.collection("users").deleteOne({ _id: user._id }),
      db.collection("comments").deleteMany({ authorId: user._id }),
      db.collection("reactions").deleteMany({ userId: user._id }),
      db.collection("bookmarks").deleteMany({ userId: user._id }),
      db.collection("notifications").deleteMany({ recipientId: user._id }),
      db.collection("sessions").deleteMany({ userId: user._id }),
      db.collection("userPreferences").deleteOne({ userId: user._id }),
      db.collection("commentReactions").deleteMany({ userId: user._id }),
    ]);

    // ২. সেশন কুকি ক্লিয়ার করা
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
    
    return res;
  } catch (e) {
    console.error("[delete-account]", e);
    return NextResponse.json({ error: "internal_error", detail: e.message }, { status: 500 });
  }
}

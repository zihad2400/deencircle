import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb/connection";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema, parseOrThrow } from "@/lib/validation/schemas";
import { createSession, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { notifyAllAdmins } from "@/lib/services/notifications";

export async function POST(req) {
  try {
    const body = await req.json();
    const data = parseOrThrow(registerSchema, body);

    const db = await getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email: data.email });
    if (existing) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const now = new Date();

    const result = await users.insertOne({
      email: data.email,
      passwordHash,
      displayName: data.displayName,
      role: "user",
      status: "active",
      emailVerified: true,
      preferredLanguage: data.preferredLanguage,
      preferredTheme: "system",
      createdAt: now,
      updatedAt: now,
    });

    // 🔔 অ্যাডমিনকে নোটিফিকেশন পাঠানো (নতুন ইউজার সাইন আপ)
    await notifyAllAdmins({
      type: "system",
      title: "New User Registered",
      body: `${data.displayName} (${data.email}) just joined DeenCircle.`,
      link: "/admin/users",
      meta: { userId: String(result.insertedId) },
    });

    const { jwt, expiresAt } = await createSession({ userId: result.insertedId, role: "user" });
    const res = NextResponse.json({ 
      ok: true, 
      user: { id: String(result.insertedId), role: "user" } 
    });
    res.cookies.set(SESSION_COOKIE_NAME, jwt, sessionCookieOptions(expiresAt));
    
    return res;
  } catch (e) {
    if (e.status === 400) {
      return NextResponse.json({ error: "validation_failed", issues: e.issues }, { status: 400 });
    }
    console.error("[register]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

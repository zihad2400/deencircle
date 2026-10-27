import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb/connection";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { loginSchema, parseOrThrow } from "@/lib/validation/schemas";

export async function POST(req) {
  try {
    const body = await req.json();
    const data = parseOrThrow(loginSchema, body);

    const db = await getDb();
    const user = await db.collection("users").findOne({ email: data.email });
    
    if (!user) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    if (user.status === "suspended") return NextResponse.json({ error: "account_suspended" }, { status: 403 });

    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

    // সরাসরি সেশন তৈরি (কোনো OTP নেই)
    const { jwt, expiresAt } = await createSession({ userId: user._id, role: user.role });
    const res = NextResponse.json({
      ok: true,
      user: { id: String(user._id), email: user.email, displayName: user.displayName, role: user.role }
    });
    res.cookies.set(SESSION_COOKIE_NAME, jwt, sessionCookieOptions(expiresAt));
    return res;

  } catch (e) {
    if (e.status === 400) return NextResponse.json({ error: "validation_failed", issues: e.issues }, { status: 400 });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

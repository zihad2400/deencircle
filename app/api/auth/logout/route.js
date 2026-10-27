import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  verifySessionJwt,
  destroySession,
} from "@/lib/auth/session";

export async function POST() {
  const jar = await cookies();
  const jwt = jar.get(SESSION_COOKIE_NAME)?.value;
  if (jwt) {
    const payload = await verifySessionJwt(jwt);
    if (payload?.sid) await destroySession(payload.sid);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}

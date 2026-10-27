import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/mongodb/connection";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "ts_session";
const TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 604800); // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET missing or too short (need >= 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession({ userId, role }) {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_SECONDS * 1000);

  await db.collection("sessions").insertOne({
    token,
    userId,
    role,
    createdAt: now,
    expiresAt,
  });

  const jwt = await new SignJWT({ sid: token, uid: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getSecret());

  return { jwt, expiresAt, ttlSeconds: TTL_SECONDS };
}

export async function verifySessionJwt(jwt) {
  try {
    const { payload } = await jwtVerify(jwt, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function loadSessionFromDb(sid) {
  if (!sid) return null;
  const db = await getDb();
  const session = await db.collection("sessions").findOne({ token: sid });
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await db.collection("sessions").deleteOne({ token: sid });
    return null;
  }
  return session;
}

export async function destroySession(sid) {
  if (!sid) return;
  const db = await getDb();
  await db.collection("sessions").deleteOne({ token: sid });
}

export function sessionCookieOptions(expiresAt) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

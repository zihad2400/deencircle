import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb/connection";
import {
  SESSION_COOKIE_NAME,
  verifySessionJwt,
  loadSessionFromDb,
} from "@/lib/auth/session";

// Safe user projection — never leak passwordHash.
const SAFE_FIELDS = {
  passwordHash: 0,
  emailVerificationToken: 0,
  passwordResetToken: 0,
};

export async function getCurrentUser() {
  const jar = await cookies();
  const jwt = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!jwt) return null;

  const payload = await verifySessionJwt(jwt);
  if (!payload?.sid) return null;

  const session = await loadSessionFromDb(payload.sid);
  if (!session) return null;

  const db = await getDb();
  const user = await db
    .collection("users")
    .findOne({ _id: session.userId }, { projection: SAFE_FIELDS });

  if (!user) return null;
  if (user.status === "suspended") return null;
  return user;
}

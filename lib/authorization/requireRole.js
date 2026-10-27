import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export class AuthError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError(403, "forbidden");
  return user;
}

// Wrap a route handler to convert AuthError to JSON response.
export function withAuth(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof AuthError) {
        return NextResponse.json({ error: e.code }, { status: e.status });
      }
      console.error("[route handler error]", e);
      return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
  };
}

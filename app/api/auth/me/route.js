import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: {
      id: String(user._id),
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      preferredLanguage: user.preferredLanguage,
      preferredTheme: user.preferredTheme,
    },
  });
}

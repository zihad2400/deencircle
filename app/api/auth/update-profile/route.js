import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const schema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().max(200).optional(),
  avatarUrl: z.string().optional(),
  preferredLanguage: z.enum(["en", "bn", "ar", "ur", "hi", "es", "fr", "tr", "id", "ru", "zh"]).optional(),
  preferredTheme: z.enum(["light", "dark", "system"]).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "validation_failed", issues: parsed.error.issues }, { status: 400 });
    }
    
    const d = parsed.data;
    const db = await getDb();
    const updates = { updatedAt: new Date() };

    if (d.displayName) updates.displayName = d.displayName;
    if (d.bio !== undefined) updates.bio = d.bio;
    if (d.avatarUrl !== undefined) updates.avatarUrl = d.avatarUrl;
    if (d.preferredLanguage) updates.preferredLanguage = d.preferredLanguage;
    if (d.preferredTheme) updates.preferredTheme = d.preferredTheme;

    if (d.newPassword) {
      if (!d.currentPassword) {
        return NextResponse.json({ error: "current_password_required" }, { status: 400 });
      }
      
      const fresh = await db.collection("users").findOne(
        { _id: user._id }, 
        { projection: { passwordHash: 1 } }
      );
      
      const ok = await verifyPassword(d.currentPassword, fresh?.passwordHash || "");
      if (!ok) {
        return NextResponse.json({ error: "wrong_current_password" }, { status: 400 });
      }
      
      updates.passwordHash = await hashPassword(d.newPassword);
      // পাসওয়ার্ড পরিবর্তন হলে সব সেশন ডিলিট করা
      await db.collection("sessions").deleteMany({ userId: user._id });
    }

    await db.collection("users").updateOne({ _id: user._id }, { $set: updates });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[update-profile]", e);
    return NextResponse.json({ error: "internal_error", detail: e.message }, { status: 500 });
  }
}

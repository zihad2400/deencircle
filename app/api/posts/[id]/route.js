import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb/connection";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

async function adminOnly() {
  const user = await getCurrentUser();
  if (!user) return { res: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (user.role !== "admin") return { res: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user };
}

export async function PATCH(req, { params }) {
  const { user, res } = await adminOnly();
  if (res) return res;
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    const body = await req.json();
    const allowed = {};
    if (typeof body.content === "string" && body.content.trim()) allowed.content = body.content.trim().slice(0, 5000);
    if (body.pinned === true || body.pinned === false) allowed.pinned = body.pinned;
    if (["draft", "published", "archived"].includes(body.status)) allowed.status = body.status;
    if (Object.keys(allowed).length === 0) return NextResponse.json({ error: "no_fields" }, { status: 400 });

    allowed.updatedAt = new Date();
    allowed.edited = true;
    if (allowed.status === "published") allowed.publishedAt = new Date();

    const db = await getDb();
    const result = await db.collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $set: allowed }
    );
    if (result.matchedCount === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[posts PATCH]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { res } = await adminOnly();
  if (res) return res;
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });
    const db = await getDb();
    const r = await db.collection("posts").deleteOne({ _id: new ObjectId(id) });
    if (r.deletedCount === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    await db.collection("comments").deleteMany({ postId: new ObjectId(id) });
    await db.collection("reactions").deleteMany({ postId: new ObjectId(id) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[posts DELETE]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

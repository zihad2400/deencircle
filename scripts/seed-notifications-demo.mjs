import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, ObjectId } from "mongodb";

try {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
const dbName = process.env.MONGODB_DB_NAME || "textsphere";

async function run() {
  await client.connect();
  const db = client.db(dbName);
  const admin = await db.collection("users").findOne({ role: "admin" });
  if (!admin) { console.error("No admin found"); process.exit(1); }
  const now = new Date();
  const docs = [
    {
      recipientId: admin._id, audience: "admin", type: "system",
      title: "Welcome to Nur Admin",
      body: "You can now publish posts and moderate content.",
      link: "/admin", meta: {}, read: false, readAt: null, createdAt: now,
    },
    {
      recipientId: admin._id, audience: "admin", type: "moderation",
      title: "1 new report awaiting review",
      body: "A user reported a comment. Open the moderation queue.",
      link: "/admin/moderation", meta: {}, read: false, readAt: null,
      createdAt: new Date(now.getTime() - 5 * 60 * 1000),
    },
    {
      recipientId: admin._id, audience: "admin", type: "post_published",
      title: "Your post is live",
      body: "Community update #1 is now visible to everyone.",
      link: "/", meta: {}, read: true, readAt: now,
      createdAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
  ];
  await db.collection("notifications").insertMany(docs);
  console.log(`Inserted ${docs.length} demo notifications for ${admin.email}`);
  await client.close();
}
run().catch((e) => { console.error(e); process.exit(1); });

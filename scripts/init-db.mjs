// Usage: node scripts/init-db.mjs
// Creates collections + indexes. Idempotent — safe to run repeatedly.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* .env.local optional if vars already exported */
  }
}

loadEnvLocal();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "textsphere";
if (!uri) {
  console.error("MONGODB_URI missing. Set it in .env.local");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

async function ensureCollection(db, name, validator) {
  const existing = await db.listCollections({ name }).toArray();
  if (existing.length === 0) {
    await db.createCollection(name, validator ? { validator } : {});
    console.log(`created collection: ${name}`);
  } else {
    console.log(`exists collection: ${name}`);
  }
}

async function run() {
  await client.connect();
  const db = client.db(dbName);
  console.log(`connected to ${dbName}`);

  await ensureCollection(db, "users", {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "passwordHash", "role", "createdAt"],
      properties: {
        email: { bsonType: "string" },
        passwordHash: { bsonType: "string" },
        role: { enum: ["admin", "user"] },
        status: { enum: ["active", "suspended"] },
        createdAt: { bsonType: "date" },
      },
    },
  });
  await ensureCollection(db, "posts");
  await ensureCollection(db, "reactions");
  await ensureCollection(db, "comments");
  await ensureCollection(db, "notifications");
  await ensureCollection(db, "contentReports");
  await ensureCollection(db, "auditLogs");
  await ensureCollection(db, "userPreferences");
  await ensureCollection(db, "sessions");

  // Indexes
  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true, name: "uniq_email" });
  await users.createIndex({ role: 1, status: 1 }, { name: "role_status" });

  const posts = db.collection("posts");
  await posts.createIndex({ status: 1, publishedAt: -1 }, { name: "status_published" });
  await posts.createIndex({ pinned: -1, publishedAt: -1 }, { name: "pinned_published" });

  const reactions = db.collection("reactions");
  await reactions.createIndex(
    { postId: 1, userId: 1 },
    { unique: true, name: "uniq_post_user_reaction" }
  );
  await reactions.createIndex({ postId: 1, type: 1 }, { name: "post_type" });

  const comments = db.collection("comments");
  await comments.createIndex({ postId: 1, createdAt: 1 }, { name: "post_created" });
  await comments.createIndex({ parentId: 1 }, { name: "parent", sparse: true });

  const notifications = db.collection("notifications");
  await notifications.createIndex(
    { recipientId: 1, read: 1, createdAt: -1 },
    { name: "recipient_read_created" }
  );

  const sessions = db.collection("sessions");
  await sessions.createIndex({ token: 1 }, { unique: true, name: "uniq_token" });
  await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ttl_expiry" });

  const reports = db.collection("contentReports");
  await reports.createIndex({ status: 1, createdAt: -1 }, { name: "status_created" });

  const audit = db.collection("auditLogs");
  await audit.createIndex({ actorId: 1, createdAt: -1 }, { name: "actor_created" });

  // Health check
  const ping = await db.command({ ping: 1 });
  console.log("PING:", JSON.stringify(ping));
  console.log("OK: init-db complete");
  await client.close();
}

run().catch((err) => {
  console.error("INIT-DB FAILED:", err.message);
  process.exit(1);
});

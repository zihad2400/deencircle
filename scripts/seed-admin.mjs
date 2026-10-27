// Usage: node scripts/seed-admin.mjs
// Reads INITIAL_ADMIN_* from .env.local. Never hardcodes credentials.
// Idempotent: if an admin with the email exists, does nothing.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnvLocal();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "textsphere";
const email = (process.env.INITIAL_ADMIN_EMAIL || "").toLowerCase().trim();
const password = process.env.INITIAL_ADMIN_PASSWORD || "";
const name = process.env.INITIAL_ADMIN_NAME || "Administrator";

if (!uri || !email || !password) {
  console.error("Missing MONGODB_URI / INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD");
  process.exit(1);
}
if (password.length < 10) {
  console.error("INITIAL_ADMIN_PASSWORD must be >= 10 chars");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
async function run() {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");
  const existing = await users.findOne({ email });
  if (existing) {
    console.log(`admin already exists: ${email}`);
    await client.close();
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  await users.insertOne({
    email,
    passwordHash,
    displayName: name,
    role: "admin",
    status: "active",
    emailVerified: true,
    preferredLanguage: "en",
    preferredTheme: "system",
    createdAt: now,
    updatedAt: now,
  });
  console.log(`created admin: ${email}`);
  await client.close();
}
run().catch((e) => {
  console.error("SEED FAILED:", e.message);
  process.exit(1);
});

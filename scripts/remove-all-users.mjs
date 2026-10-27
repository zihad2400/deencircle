import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, ObjectId } from "mongodb";

// Load env
try {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "textsphere";

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
await client.connect();
const db = client.db(dbName);

console.log(`🔍 Connected to database: ${dbName}`);

// ১. অ্যাডমিন ছাড়া সব ইউজার খুঁজে বের করা
const nonAdmins = await db.collection("users").find({ role: { $ne: "admin" } }).toArray();
const userIds = nonAdmins.map(u => u._id);

if (userIds.length === 0) {
  console.log("✅ No regular users to delete. Only admins exist.");
  await client.close();
  process.exit(0);
}

console.log(`🗑️  Found ${userIds.length} regular user(s) to delete:`);
nonAdmins.forEach(u => console.log(`   - ${u.email} (${u.displayName})`));

// ২. ইউজার ডিলিট করা
const delUsers = await db.collection("users").deleteMany({ role: { $ne: "admin" } });
console.log(`✅ Deleted ${delUsers.deletedCount} users from 'users' collection.`);

// ৩. তাদের সেশন, কমেন্ট, রিঅ্যাকশন, বুকমার্ক ডিলিট করা
const delSessions = await db.collection("sessions").deleteMany({ userId: { $in: userIds } });
console.log(`✅ Deleted ${delSessions.deletedCount} sessions.`);

const delComments = await db.collection("comments").deleteMany({ authorId: { $in: userIds } });
console.log(`✅ Deleted ${delComments.deletedCount} comments.`);

const delReactions = await db.collection("reactions").deleteMany({ userId: { $in: userIds } });
console.log(`✅ Deleted ${delReactions.deletedCount} reactions.`);

const delBookmarks = await db.collection("bookmarks").deleteMany({ userId: { $in: userIds } });
console.log(`✅ Deleted ${delBookmarks.deletedCount} bookmarks.`);

// ৪. নোটিফিকেশন ডিলিট করা
const delNotifications = await db.collection("notifications").deleteMany({ recipientId: { $in: userIds } });
console.log(`✅ Deleted ${delNotifications.deletedCount} notifications.`);

console.log("\n🎉 Cleanup complete! Only admin accounts remain.");
await client.close();

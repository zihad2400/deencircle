import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";

// Load env
try {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "deencircle";

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

console.log(`🔍 Connected to database: ${dbName}`);

// ১. নতুন ইউজার তৈরি
const users = db.collection("users");
const hash = await bcrypt.hash("Password123!", 12);

const testUsers = [
  { email: "abdullah@deencircle.com", displayName: "Abdullah", role: "user" },
  { email: "fatima@deencircle.com", displayName: "Fatima", role: "user" },
];

for (const u of testUsers) {
  const exists = await users.findOne({ email: u.email });
  if (!exists) {
    await users.insertOne({
      email: u.email,
      passwordHash: hash,
      displayName: u.displayName,
      role: u.role,
      status: "active",
      emailVerified: true,
      bio: `Assalamu Alaikum, I am ${u.displayName}.`,
      preferredLanguage: "en",
      preferredTheme: "system",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Created user: ${u.displayName} <${u.email}>`);
  } else {
    console.log(`⚠️  User already exists: ${u.email}`);
  }
}

const abdullah = await users.findOne({ email: "abdullah@deencircle.com" });
const fatima = await users.findOne({ email: "fatima@deencircle.com" });

// ২. একটি নতুন পোস্ট তৈরি (অ্যাডমিনের হয়ে)
const admin = await users.findOne({ role: "admin" });
if (!admin) {
  console.error("❌ No admin found. Create an admin first.");
  await client.close();
  process.exit(1);
}

const posts = db.collection("posts");
const newPost = await posts.insertOne({
  content: "আসসালামু আলাইকুম! DeenCircle-এ নতুন একটি পোস্ট। ইসলামিক জ্ঞান সবার মাঝে ছড়িয়ে দিই।",
  status: "published",
  pinned: false,
  authorId: admin._id,
  authorName: admin.displayName,
  createdAt: new Date(),
  updatedAt: new Date(),
  publishedAt: new Date(),
  edited: false,
  shareCount: 0,
});
console.log(`✅ Created post ID: ${newPost.insertedId}`);

// ৩. কমেন্ট তৈরি
const comments = db.collection("comments");
const c1 = await comments.insertOne({
  postId: newPost.insertedId,
  parentId: null,
  authorId: abdullah._id,
  authorName: abdullah.displayName,
  content: "মাশাআল্লাহ! খুব সুন্দর পোস্ট।",
  createdAt: new Date(),
  updatedAt: new Date(),
  edited: false,
  deletedAt: null,
  moderationStatus: "visible",
});

const c2 = await comments.insertOne({
  postId: newPost.insertedId,
  parentId: c1.insertedId,
  authorId: fatima._id,
  authorName: fatima.displayName,
  content: "জাযাকাল্লাহু খাইরান!",
  createdAt: new Date(),
  updatedAt: new Date(),
  edited: false,
  deletedAt: null,
  moderationStatus: "visible",
});
console.log(`✅ Created 2 comments (1 root, 1 reply)`);

// ৪. রিঅ্যাকশন তৈরি
const reactions = db.collection("reactions");
await reactions.insertOne({
  postId: newPost.insertedId,
  userId: abdullah._id,
  type: "love",
  createdAt: new Date(),
  updatedAt: new Date(),
});
await reactions.insertOne({
  postId: newPost.insertedId,
  userId: fatima._id,
  type: "like",
  createdAt: new Date(),
  updatedAt: new Date(),
});
console.log(`✅ Created 2 reactions`);

// ৫. বুকমার্ক তৈরি
const bookmarks = db.collection("bookmarks");
await bookmarks.insertOne({
  userId: abdullah._id,
  postId: newPost.insertedId,
  createdAt: new Date(),
});
console.log(`✅ Created 1 bookmark`);

console.log("\n🎉 Test data successfully added to MongoDB!");
await client.close();

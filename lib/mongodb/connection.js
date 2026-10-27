// Server-only MongoDB connection module.
// Never import this file into a Client Component.
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. Check .env.local");
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "deencircle";

// Next.js dev hot-reload-safe global cache. In production, a fresh
// module scope is created per server instance, which is fine.
let cached = globalThis.__textsphereMongo;
if (!cached) {
  cached = globalThis.__textsphereMongo = { client: null, promise: null };
}

export async function getMongoClient() {
  if (cached.client) return cached.client;
  if (!cached.promise) {
    cached.promise = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    }).connect();
  }
  cached.client = await cached.promise;
  return cached.client;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(dbName);
}

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

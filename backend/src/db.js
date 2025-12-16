import { MongoClient } from "mongodb";

let client;
let db;

export async function getDb() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing");

  client = new MongoClient(uri);
  await client.connect();

  db = client.db(process.env.MONGODB_DB || "cloud_notes");

  await db.collection("notes").createIndex({ createdAt: -1 });

  return db;
}

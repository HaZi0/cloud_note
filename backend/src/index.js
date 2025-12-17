import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";

import { getDb } from "./db.js";
import { createGcs, uploadToGcs } from "./gcs.js";
import { driveClientFromRefreshToken, uploadJsonToDrive } from "./drive.js";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const storage = createGcs();


// Create note (MongoDB)
app.post("/api/notes", async (req, res) => {
  const { title, body, fileUrl } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title and body are required" });

  const db = await getDb();
  const doc = {
    title,
    body,
    fileUrl: fileUrl || null,
    createdAt: new Date()
  };

  const result = await db.collection("notes").insertOne(doc);
  res.json({
    _id: result.insertedId.toString(),
    ...doc,
    createdAt: doc.createdAt.toISOString()
    });
});

// List notes (MongoDB)
app.get("/api/notes", async (req, res) => {
  const db = await getDb();
  const notes = await db
    .collection("notes")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const normalized = notes.map(n => ({
    ...n,
    _id: n._id?.toString?.() ?? n._id,
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt
  }));

  res.json(normalized);
});

// Upload file to Google Cloud Storage
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });

  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${Date.now()}_${safeName}`;

  const url = await uploadToGcs(storage, {
    buffer: req.file.buffer,
    mimeType: req.file.mimetype,
    key
  });

  res.json({ url, key });
});

// Export notes -> Google Drive
app.get("/api/export", async (req, res) => {
  const db = await getDb();
  const data = await db.collection("notes").find({}).sort({ createdAt: -1 }).toArray();

  const jsonString = JSON.stringify({ exportedAt: new Date().toISOString(), notes: data }, null, 2);
  const fileName = `cloud-notes-export-${Date.now()}.json`;

  const drive = driveClientFromRefreshToken();
  const uploaded = await uploadJsonToDrive(drive, { fileName, jsonString });

  res.json({ driveFileId: uploaded.id, fileName: uploaded.name, count: data.length });
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`API running on :${port}`));

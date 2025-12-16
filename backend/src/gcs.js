import { Storage } from "@google-cloud/storage";

export function createGcs() {
  const projectId = process.env.GCS_PROJECT_ID;
  if (!projectId) throw new Error("GCS_PROJECT_ID is missing");
  return new Storage({ projectId });
}

export async function uploadToGcs(storage, { buffer, mimeType, key }) {
  const bucketName = process.env.GCS_BUCKET;
  if (!bucketName) throw new Error("GCS_BUCKET is missing");

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(key);

  await file.save(buffer, {
    contentType: mimeType,
    resumable: false
  });

  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000 // 1 година
  });

  return signedUrl;
}

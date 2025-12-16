import { google } from "googleapis";
import { Readable } from "node:stream";

function oauth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function driveClientFromRefreshToken() {
  const client = oauth2Client();
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.drive({ version: "v3", auth: client });
}

export async function uploadJsonToDrive(drive, { fileName, jsonString }) {
  const folderId = process.env.DRIVE_FOLDER_ID;

  const bodyStream = Readable.from([jsonString]);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: "application/json",
      parents: folderId ? [folderId] : undefined
    },
    media: {
      mimeType: "application/json",
      body: bodyStream
    },
    fields: "id, name"
  });

  return res.data;
}

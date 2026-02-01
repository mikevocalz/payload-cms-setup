/**
 * Media Upload API Route
 * 
 * POST /api/media/upload - Upload media to Bunny CDN
 * 
 * CRITICAL: All client uploads go through this endpoint.
 * Bunny Storage credentials are NEVER exposed to the client.
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "deviant-storage";
const BUNNY_ACCESS_KEY = process.env.BUNNY_ACCESS_KEY || "";
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || "https://dvnt.b-cdn.net";
const BUNNY_STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;

const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_DURATION_SECONDS = 60;

async function getCurrentUser(payload: any, authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const { user } = await payload.auth({ headers: { authorization: authHeader } });
    return user;
  } catch (error) {
    console.error("[API/media/upload] Auth error:", error);
    return null;
  }
}

function generateFilename(mimeType: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif",
    "image/webp": "webp", "image/heic": "heic",
    "video/mp4": "mp4", "video/quicktime": "mov",
  };
  return `${timestamp}-${random}.${extMap[mimeType] || "bin"}`;
}

function validateFileSize(base64Data: string, mimeType: string): { valid: boolean; error?: string } {
  const sizeBytes = (base64Data.length * 3) / 4;
  const sizeMB = sizeBytes / (1024 * 1024);
  const isVideo = mimeType.startsWith("video/");
  const maxSizeMB = isVideo ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB;
  if (sizeMB > maxSizeMB) {
    return { valid: false, error: `File too large: ${sizeMB.toFixed(1)}MB (max: ${maxSizeMB}MB)` };
  }
  return { valid: true };
}

export async function POST(request: Request) {
  console.log("[API/media/upload] POST request received");

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!BUNNY_ACCESS_KEY) {
      console.error("[API/media/upload] BUNNY_ACCESS_KEY not configured");
      return Response.json({ error: "Media upload not configured" }, { status: 500 });
    }

    let body: { data: string; mimeType: string; folder?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { data, mimeType, folder = "uploads" } = body;

    if (!data || typeof data !== "string") {
      return Response.json({ error: "Missing or invalid 'data' field" }, { status: 400 });
    }
    if (!mimeType || typeof mimeType !== "string") {
      return Response.json({ error: "Missing or invalid 'mimeType' field" }, { status: 400 });
    }

    const sizeValidation = validateFileSize(data, mimeType);
    if (!sizeValidation.valid) {
      return Response.json({ error: sizeValidation.error }, { status: 400 });
    }

    const filename = generateFilename(mimeType);
    const storagePath = `${folder}/${filename}`;
    const uploadUrl = `${BUNNY_STORAGE_URL}/${storagePath}`;

    console.log("[API/media/upload] Uploading to Bunny:", {
      storagePath, mimeType, sizeKB: Math.round((data.length * 3) / 4 / 1024),
    });

    const buffer = Buffer.from(data, "base64");

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { AccessKey: BUNNY_ACCESS_KEY, "Content-Type": mimeType },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("[API/media/upload] Bunny upload failed:", uploadResponse.status, errorText);
      return Response.json({ error: `Upload failed: ${uploadResponse.status}` }, { status: 500 });
    }

    const cdnUrl = `${BUNNY_CDN_URL}/${storagePath}`;
    console.log("[API/media/upload] Upload successful:", cdnUrl);

    return Response.json({ success: true, url: cdnUrl, path: storagePath, filename, mimeType });
  } catch (error: any) {
    console.error("[API/media/upload] Error:", error);
    return Response.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    configured: !!BUNNY_ACCESS_KEY,
    cdnUrl: BUNNY_CDN_URL,
    maxImageSizeMB: MAX_IMAGE_SIZE_MB,
    maxVideoSizeMB: MAX_VIDEO_SIZE_MB,
    maxVideoDurationSeconds: MAX_VIDEO_DURATION_SECONDS,
  });
}

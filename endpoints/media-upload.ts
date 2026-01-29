/**
 * Server-side Media Upload Endpoint
 *
 * POST /api/media/upload - Upload media to Bunny CDN (server-side only)
 *
 * CRITICAL: Bunny Storage AccessKey is NEVER exposed to the client.
 * All uploads go through this server endpoint.
 */

import type { Endpoint } from "payload";

// Server-side Bunny configuration from environment
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "dvnt";
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || "de";
const BUNNY_STORAGE_API_KEY = process.env.BUNNY_STORAGE_API_KEY || "";
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || "https://dvnt.b-cdn.net";

// Get storage endpoint based on region
function getStorageEndpoint(): string {
  if (BUNNY_STORAGE_REGION === "de" || BUNNY_STORAGE_REGION === "falkenstein") {
    return "storage.bunnycdn.com";
  }
  return `${BUNNY_STORAGE_REGION}.storage.bunnycdn.com`;
}

// Generate unique filename
function generateFilename(extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${extension}`;
}

// Get date-based path
function getDatePath(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

// Build storage path
function buildStoragePath(
  folder: string,
  filename: string,
  userId?: string,
): string {
  const datePath = getDatePath();
  if (userId) {
    return `${folder}/${userId}/${datePath}/${filename}`;
  }
  return `${folder}/${datePath}/${filename}`;
}

// Get extension from mime type
function getExtensionFromMime(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/heic": "heic",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/mov": "mov",
  };
  return mimeMap[mimeType] || "jpg";
}

export const uploadMediaEndpoint: Endpoint = {
  path: "/media/upload",
  method: "post",
  handler: async (req) => {
    console.log("[Endpoint/media-upload] POST request received");

    // CRITICAL: Require authentication
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Bunny is configured
    if (!BUNNY_STORAGE_API_KEY) {
      console.error(
        "[Endpoint/media-upload] BUNNY_STORAGE_API_KEY not configured",
      );
      return Response.json(
        { error: "Media upload not configured" },
        { status: 500 },
      );
    }

    const userId = String(req.user.id);

    try {
      // Parse multipart form data or JSON with base64
      const contentType = req.headers.get("content-type") || "";

      let fileBuffer: Buffer;
      let mimeType: string;
      let folder: string = "uploads";

      if (contentType.includes("multipart/form-data")) {
        // Handle multipart upload
        const formData = await req.formData?.();
        if (!formData) {
          return Response.json({ error: "No form data" }, { status: 400 });
        }

        const file = formData.get("file") as File | null;
        folder = (formData.get("folder") as string) || "uploads";

        if (!file) {
          return Response.json({ error: "No file provided" }, { status: 400 });
        }

        mimeType = file.type;
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      } else {
        // Handle JSON with base64
        let body: any;
        try {
          body = await req.json?.();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        if (!body.data) {
          return Response.json({ error: "No data provided" }, { status: 400 });
        }

        mimeType = body.mimeType || "image/jpeg";
        folder = body.folder || "uploads";

        // Decode base64
        const base64Data = body.data.replace(/^data:[^;]+;base64,/, "");
        fileBuffer = Buffer.from(base64Data, "base64");
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        return Response.json(
          { error: "File too large (max 50MB)" },
          { status: 400 },
        );
      }

      // Generate path and filename
      const extension = getExtensionFromMime(mimeType);
      const filename = generateFilename(extension);
      const path = buildStoragePath(folder, filename, userId);

      // Bunny Storage upload URL
      const endpoint = getStorageEndpoint();
      const uploadUrl = `https://${endpoint}/${BUNNY_STORAGE_ZONE}/${path}`;

      console.log("[Endpoint/media-upload] Uploading to:", uploadUrl);
      console.log(
        "[Endpoint/media-upload] File size:",
        fileBuffer.length,
        "bytes",
      );

      // Upload to Bunny Storage
      // Convert Buffer to Uint8Array for fetch compatibility
      const uint8Array = new Uint8Array(fileBuffer);
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          AccessKey: BUNNY_STORAGE_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: uint8Array,
      });

      console.log(
        "[Endpoint/media-upload] Upload status:",
        uploadResponse.status,
      );

      if (uploadResponse.status !== 201 && uploadResponse.status !== 200) {
        const errorText = await uploadResponse.text();
        console.error("[Endpoint/media-upload] Upload failed:", errorText);
        return Response.json(
          { error: "Upload failed", details: errorText },
          { status: 500 },
        );
      }

      // Construct CDN URL
      const cdnUrl = `${BUNNY_CDN_URL}/${path}`;

      console.log("[Endpoint/media-upload] Success! CDN URL:", cdnUrl);

      return Response.json({
        success: true,
        url: cdnUrl,
        path,
        filename,
        mimeType,
        size: fileBuffer.length,
      });
    } catch (err: any) {
      console.error("[Endpoint/media-upload] Error:", err);
      return Response.json(
        { error: err.message || "Upload failed" },
        { status: 500 },
      );
    }
  },
};

// Also export a GET endpoint for checking upload status/config
export const uploadConfigEndpoint: Endpoint = {
  path: "/media/upload-config",
  method: "get",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({
      configured: !!BUNNY_STORAGE_API_KEY,
      cdnUrl: BUNNY_CDN_URL,
      maxSizeMB: 50,
      supportedTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/quicktime",
      ],
    });
  },
};

/**
 * Bunny CDN Storage Upload Utility
 *
 * Uploads files to Bunny Storage and returns the public CDN URL.
 *
 * BUNNY CREDENTIALS (from production):
 * - Storage Zone: dvnt
 * - Region: de
 * - CDN URL: https://dvnt.b-cdn.net
 */

// Bunny Storage configuration - production values
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "dvnt";
const BUNNY_STORAGE_API_KEY =
  process.env.BUNNY_STORAGE_API_KEY ||
  "a51bbae5-586e-4bc4-a9c6086f6825-4507-484b";
const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION || "de";
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL || "https://dvnt.b-cdn.net";

// Bunny Storage API endpoint based on region
function getBunnyStorageUrl(): string {
  // de region uses storage.bunnycdn.com, other regions use regional endpoints
  if (BUNNY_STORAGE_REGION === "de" || !BUNNY_STORAGE_REGION) {
    return `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;
  }
  return `https://${BUNNY_STORAGE_REGION}.storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;
}

export interface UploadOptions {
  /** Path within the storage zone (e.g., 'avatars/users/123/avatar.png') */
  path: string;
  /** File buffer to upload */
  buffer: Buffer;
  /** Content type (e.g., 'image/png') */
  contentType: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a file to Bunny Storage
 *
 * @param options Upload options including path, buffer, and content type
 * @returns Promise with the public CDN URL or error
 */
export async function uploadToBunny(
  options: UploadOptions,
): Promise<UploadResult> {
  const { path, buffer, contentType } = options;

  // Validate inputs
  if (!path || !buffer || buffer.length === 0) {
    return { success: false, error: "Invalid upload parameters" };
  }

  // Ensure path doesn't start with /
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  const storageUrl = getBunnyStorageUrl();
  const uploadUrl = `${storageUrl}/${cleanPath}`;

  console.log(`[Bunny] Uploading to: ${uploadUrl}`);

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_STORAGE_API_KEY,
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
      },
      // Convert Buffer to Uint8Array for fetch compatibility
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Bunny] Upload failed: ${response.status} ${errorText}`);
      return {
        success: false,
        error: `Upload failed: ${response.status} ${response.statusText}`,
      };
    }

    // Construct the public CDN URL
    const publicUrl = `${BUNNY_CDN_URL}/${cleanPath}`;
    console.log(`[Bunny] Upload successful: ${publicUrl}`);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error(`[Bunny] Upload error:`, error);
    return {
      success: false,
      error: error?.message || "Unknown upload error",
    };
  }
}

/**
 * Delete a file from Bunny Storage
 *
 * @param path Path to the file to delete
 * @returns Promise with success status
 */
export async function deleteFromBunny(
  path: string,
): Promise<{ success: boolean; error?: string }> {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const storageUrl = getBunnyStorageUrl();
  const deleteUrl = `${storageUrl}/${cleanPath}`;

  try {
    const response = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        AccessKey: BUNNY_STORAGE_API_KEY,
      },
    });

    if (!response.ok && response.status !== 404) {
      return { success: false, error: `Delete failed: ${response.status}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Unknown delete error" };
  }
}

/**
 * Generate the avatar path for a user
 *
 * @param userId User ID
 * @returns Path string for Bunny Storage
 */
export function getAvatarPath(userId: string | number): string {
  return `avatars/users/${userId}/avatar.png`;
}

/**
 * Generate the full CDN URL for a user's avatar
 *
 * @param userId User ID
 * @returns Full CDN URL
 */
export function getAvatarUrl(userId: string | number): string {
  return `${BUNNY_CDN_URL}/${getAvatarPath(userId)}`;
}

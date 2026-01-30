# Bunny CDN Server-Side Upload Setup

## Required Environment Variables (Vercel)

Add these to your Vercel project environment variables for the Payload CMS deployment:

```
BUNNY_STORAGE_ZONE=dvnt
BUNNY_STORAGE_REGION=de
BUNNY_STORAGE_API_KEY=<your-storage-access-key>
BUNNY_CDN_URL=https://dvnt.b-cdn.net
```

## Where to Find Your Bunny Storage Access Key

1. Log in to Bunny.net dashboard
2. Go to Storage → Your Storage Zone (dvnt)
3. Click "FTP & API access"
4. Copy the **Password** field (this is your Storage Access Key)

## Important Notes

- **NEVER** expose `BUNNY_STORAGE_API_KEY` to the client/mobile app
- All uploads go through `POST /api/media/upload` on the Payload server
- The mobile app uses `lib/server-upload.ts` which calls this endpoint
- If `BUNNY_STORAGE_API_KEY` is not set, uploads will fail with 500 error

## Endpoint Reference

### POST /api/media/upload

Upload media to Bunny CDN via server.

**Auth:** Required (Cookie)

**Body (JSON):**
```json
{
  "data": "<base64-encoded-file>",
  "mimeType": "image/jpeg",
  "folder": "avatars"
}
```

**Body (multipart/form-data):**
- `file`: The file to upload
- `folder`: Destination folder (avatars, posts, stories, etc.)

**Response:**
```json
{
  "success": true,
  "url": "https://dvnt.b-cdn.net/avatars/123/2025/01/30/1234567890-abc123.jpg",
  "path": "avatars/123/2025/01/30/1234567890-abc123.jpg",
  "filename": "1234567890-abc123.jpg",
  "mimeType": "image/jpeg",
  "size": 123456
}
```

### GET /api/media/upload-config

Check if upload is configured.

**Auth:** Required

**Response:**
```json
{
  "configured": true,
  "cdnUrl": "https://dvnt.b-cdn.net",
  "maxSizeMB": 50,
  "supportedTypes": ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"]
}
```

## Testing with curl

```bash
# Upload via JSON (base64)
curl -X POST "https://payload-cms-setup-gray.vercel.app/api/media/upload" \
  -H "Content-Type: application/json" \
  -H "Cookie: payload-token=<your-jwt>" \
  -d '{"data":"<base64>","mimeType":"image/jpeg","folder":"test"}'

# Upload via multipart
curl -X POST "https://payload-cms-setup-gray.vercel.app/api/media/upload" \
  -H "Cookie: payload-token=<your-jwt>" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=test"
```

/**
 * Conversation Messages API Route
 * 
 * GET /api/conversations/:id/messages - Get messages in conversation
 * POST /api/conversations/:id/messages - Send message (text, image, or video)
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

const MAX_VIDEO_DURATION_SECONDS = 60;

async function getCurrentUser(payload: any, authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("JWT ")) return null;
  try {
    const { user } = await payload.auth({ headers: { authorization: authHeader } });
    return user;
  } catch (error) {
    console.error("[API/conversations/messages] Auth error:", error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  console.log("[API/conversations/messages] GET:", conversationId);

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(currentUser.id);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

    // Verify user is participant
    const conversation = await payload.findByID({
      collection: "conversations",
      id: conversationId,
      depth: 0,
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    const participantIds = ((conversation as any).participants || [])
      .map((p: any) => String(typeof p === "object" ? p.id : p))
      .filter(Boolean);

    if (!participantIds.includes(userId)) {
      return Response.json({ error: "Not a participant" }, { status: 403 });
    }

    // Fetch messages
    const messages = await payload.find({
      collection: "messages",
      where: {
        conversation: { equals: conversationId },
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    });

    return Response.json(messages);
  } catch (error: any) {
    console.error("[API/conversations/messages] Error:", error);
    return Response.json({ error: error.message || "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  console.log("[API/conversations/messages] POST:", conversationId);

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(currentUser.id);

    // Parse request body
    let body: {
      text?: string;
      imageUrl?: string;
      videoUrl?: string;
      videoDuration?: number;
      clientMutationId?: string;
    };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, imageUrl, videoUrl, videoDuration, clientMutationId } = body;

    // INVARIANT: At least one of text/imageUrl/videoUrl required
    if (!text?.trim() && !imageUrl && !videoUrl) {
      return Response.json(
        { error: "Message must have text, image, or video" },
        { status: 400 }
      );
    }

    // INVARIANT: Video duration must be <= 60 seconds
    if (videoUrl && videoDuration && videoDuration > MAX_VIDEO_DURATION_SECONDS) {
      return Response.json(
        { error: `Video too long: ${videoDuration}s (max: ${MAX_VIDEO_DURATION_SECONDS}s)` },
        { status: 400 }
      );
    }

    // INVARIANT: URLs must not be empty strings
    if (imageUrl !== undefined && (!imageUrl || imageUrl.trim() === "")) {
      return Response.json({ error: "imageUrl cannot be empty" }, { status: 400 });
    }
    if (videoUrl !== undefined && (!videoUrl || videoUrl.trim() === "")) {
      return Response.json({ error: "videoUrl cannot be empty" }, { status: 400 });
    }

    // Build media array
    const media: Array<{ type: "image" | "video"; url: string }> = [];
    if (imageUrl) {
      media.push({ type: "image", url: imageUrl });
    }
    if (videoUrl) {
      media.push({ type: "video", url: videoUrl });
    }

    // Dedupe by clientMutationId
    if (clientMutationId) {
      const existing = await payload.find({
        collection: "messages",
        where: {
          conversation: { equals: conversationId },
          sender: { equals: userId },
          // Note: clientMutationId field would need to be added to Messages collection
        },
        limit: 1,
      });

      // For now, skip dedupe check since field may not exist
    }

    // Create message
    const message = await payload.create({
      collection: "messages",
      data: {
        conversation: conversationId,
        sender: userId,
        content: text?.trim() || "",
        media: media.length > 0 ? media : undefined,
      },
    });

    // Fetch with depth to populate sender
    const populated = await payload.findByID({
      collection: "messages",
      id: message.id,
      depth: 2,
    });

    console.log("[API/conversations/messages] Created message:", {
      id: message.id,
      conversationId,
      hasText: !!text,
      hasImage: !!imageUrl,
      hasVideo: !!videoUrl,
    });

    return Response.json(populated, { status: 201 });
  } catch (error: any) {
    console.error("[API/conversations/messages] Error:", error);
    return Response.json({ error: error.message || "Failed to send message" }, { status: error.status || 500 });
  }
}

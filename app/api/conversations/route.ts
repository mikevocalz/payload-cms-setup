/**
 * Conversations API Route
 * 
 * GET /api/conversations - List user's conversations
 * POST /api/conversations - Create new conversation (direct or group)
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

async function getCurrentUser(payload: any, authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("JWT ")) return null;
  try {
    const { user } = await payload.auth({ headers: { authorization: authHeader } });
    return user;
  } catch (error) {
    console.error("[API/conversations] Auth error:", error);
    return null;
  }
}

export async function GET(request: Request) {
  console.log("[API/conversations] GET request received");

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
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);

    const conversations = await payload.find({
      collection: "conversations",
      where: {
        participants: { contains: userId },
      },
      sort: "-lastMessageAt",
      page,
      limit,
      depth: 2,
    });

    return Response.json(conversations);
  } catch (error: any) {
    console.error("[API/conversations] Error:", error);
    return Response.json({ error: error.message || "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log("[API/conversations] POST request received");

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(currentUser.id);

    let body: { participantIds: string[]; isGroup?: boolean; groupName?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { participantIds, isGroup, groupName } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return Response.json({ error: "participantIds array is required" }, { status: 400 });
    }

    // Ensure current user is included in participants
    const allParticipants = [...new Set([userId, ...participantIds.map(String)])];

    // Validate participant count
    if (allParticipants.length < 2) {
      return Response.json({ error: "At least 2 participants required" }, { status: 400 });
    }

    const isGroupConversation = isGroup === true || allParticipants.length > 2;

    // For direct conversations, check if one already exists
    if (!isGroupConversation && allParticipants.length === 2) {
      const [user1, user2] = allParticipants.sort();
      const existing = await payload.find({
        collection: "conversations",
        where: {
          and: [
            { isGroup: { equals: false } },
            { participants: { contains: user1 } },
            { participants: { contains: user2 } },
          ],
        },
        limit: 1,
        depth: 2,
      });

      if (existing.docs.length > 0) {
        console.log("[API/conversations] Returning existing direct conversation");
        return Response.json(existing.docs[0]);
      }
    }

    // Create new conversation
    const conversation = await payload.create({
      collection: "conversations",
      data: {
        participants: allParticipants,
        isGroup: isGroupConversation,
        groupName: isGroupConversation ? groupName : undefined,
        lastMessageAt: new Date().toISOString(),
      },
    });

    // Fetch with depth to populate participants
    const populated = await payload.findByID({
      collection: "conversations",
      id: conversation.id,
      depth: 2,
    });

    console.log("[API/conversations] Created conversation:", {
      id: conversation.id,
      isGroup: isGroupConversation,
      participantCount: allParticipants.length,
    });

    return Response.json(populated, { status: 201 });
  } catch (error: any) {
    console.error("[API/conversations] Error:", error);
    
    // Handle duplicate conversation error
    if (error.status === 409 && error.existingId) {
      const payload = await getPayload({ config: configPromise });
      const existing = await payload.findByID({
        collection: "conversations",
        id: error.existingId,
        depth: 2,
      });
      return Response.json(existing);
    }
    
    return Response.json({ error: error.message || "Failed to create conversation" }, { status: error.status || 500 });
  }
}

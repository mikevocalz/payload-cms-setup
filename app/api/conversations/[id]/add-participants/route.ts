/**
 * Add Participants to Conversation API Route
 * 
 * POST /api/conversations/:id/add-participants - Add users to group chat
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
    console.error("[API/conversations/add-participants] Auth error:", error);
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  console.log("[API/conversations/add-participants] POST:", conversationId);

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(currentUser.id);

    // Fetch conversation
    const conversation = await payload.findByID({
      collection: "conversations",
      id: conversationId,
      depth: 0,
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get current participant IDs
    const currentParticipants = ((conversation as any).participants || [])
      .map((p: any) => String(typeof p === "object" ? p.id : p))
      .filter(Boolean);

    // Check if current user is a participant
    if (!currentParticipants.includes(userId)) {
      return Response.json({ error: "You are not a participant in this conversation" }, { status: 403 });
    }

    // Parse request body
    let body: { userIds: string[] };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: "userIds array is required" }, { status: 400 });
    }

    // Merge participants (deduplicated)
    const newParticipants = [...new Set([...currentParticipants, ...userIds.map(String)])];

    // If this was a direct conversation and we're adding more people, it becomes a group
    const wasGroup = (conversation as any).isGroup === true;
    const isNowGroup = newParticipants.length > 2;

    if (!wasGroup && isNowGroup) {
      console.log("[API/conversations/add-participants] Converting direct to group chat");
    }

    // Update conversation
    const updated = await payload.update({
      collection: "conversations",
      id: conversationId,
      data: {
        participants: newParticipants,
        isGroup: isNowGroup,
      },
    });

    // Fetch with depth to populate participants
    const populated = await payload.findByID({
      collection: "conversations",
      id: conversationId,
      depth: 2,
    });

    console.log("[API/conversations/add-participants] Added participants:", {
      conversationId,
      addedCount: newParticipants.length - currentParticipants.length,
      totalParticipants: newParticipants.length,
    });

    return Response.json(populated);
  } catch (error: any) {
    console.error("[API/conversations/add-participants] Error:", error);
    return Response.json({ error: error.message || "Failed to add participants" }, { status: error.status || 500 });
  }
}

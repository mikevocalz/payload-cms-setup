/**
 * Direct Conversation API Route
 * POST /api/conversations/direct - Create or get direct conversation
 */

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const payload = await getPayload({ config });
  const headersList = await headers();

  try {
    const { user } = await payload.auth({ headers: headersList });
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { userId } = body;
    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    const currentUserId = Number(user.id);
    const targetUserId = Number(userId);

    if (isNaN(currentUserId) || isNaN(targetUserId)) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (currentUserId === targetUserId) {
      return Response.json({ error: "Cannot create conversation with yourself" }, { status: 400 });
    }

    // Check target user exists
    const targetUser = await payload.findByID({
      collection: "users",
      id: targetUserId,
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Create deterministic directKey
    const participantIds = [currentUserId, targetUserId].sort((a, b) => a - b);
    const directKey = `direct:${participantIds[0]}:${participantIds[1]}`;

    // Check for existing conversation
    const existing = await payload.find({
      collection: "conversations",
      where: {
        directKey: { equals: directKey },
      },
      limit: 1,
      depth: 1,
    });

    if (existing.totalDocs > 0) {
      return Response.json({
        conversation: existing.docs[0],
        created: false,
      });
    }

    // Create new conversation
    const conversation = await payload.create({
      collection: "conversations",
      data: {
        participants: participantIds,
        directKey,
        isGroup: false,
      } as any,
    });

    // Fetch with depth to get participant details
    const fullConversation = await payload.findByID({
      collection: "conversations",
      id: conversation.id,
      depth: 1,
    });

    return Response.json({
      conversation: fullConversation,
      created: true,
    });
  } catch (err: any) {
    console.error("[API/conversations/direct] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Story Reply API Route
 * POST /api/stories/:id/reply - Reply to a story (creates DM)
 */

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: storyId } = await params;
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

    const { text, clientMutationId } = body;
    if (!text?.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const storyIdNum = Number(storyId);
    if (isNaN(storyIdNum)) {
      return Response.json({ error: "Invalid story ID" }, { status: 400 });
    }

    // Get the story to find the author
    const story = await payload.findByID({
      collection: "stories",
      id: storyIdNum,
      depth: 1,
    });

    if (!story) {
      return Response.json({ error: "Story not found" }, { status: 404 });
    }

    const storyAuthorId = typeof (story as any).author === "object" 
      ? (story as any).author?.id 
      : (story as any).author;

    if (!storyAuthorId) {
      return Response.json({ error: "Story author not found" }, { status: 404 });
    }

    const senderId = Number(user.id);
    const recipientId = Number(storyAuthorId);

    if (senderId === recipientId) {
      return Response.json({ error: "Cannot reply to your own story" }, { status: 400 });
    }

    // Find or create direct conversation
    const participantIds = [senderId, recipientId].sort((a, b) => a - b);
    const directKey = `direct:${participantIds[0]}:${participantIds[1]}`;

    let conversation = await payload.find({
      collection: "conversations",
      where: {
        directKey: { equals: directKey },
      },
      limit: 1,
    });

    let conversationId: number;

    if (conversation.totalDocs > 0) {
      conversationId = conversation.docs[0].id as number;
    } else {
      // Create new conversation
      const newConversation = await payload.create({
        collection: "conversations",
        data: {
          participants: participantIds,
          directKey,
          isGroup: false,
        } as any,
      });
      conversationId = newConversation.id as number;
    }

    // Create the message with story reference
    const message = await payload.create({
      collection: "messages",
      data: {
        conversation: conversationId,
        sender: senderId,
        content: text.trim(),
        story: storyIdNum,
        clientMutationId: clientMutationId || undefined,
      } as any,
    });

    // Update conversation lastMessageAt
    await payload.update({
      collection: "conversations",
      id: conversationId,
      data: {
        lastMessageAt: new Date().toISOString(),
        lastMessagePreview: text.trim().substring(0, 100),
      } as any,
    });

    return Response.json({
      message,
      conversationId: String(conversationId),
    });
  } catch (err: any) {
    console.error("[API/story-reply] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

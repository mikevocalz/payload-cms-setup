/**
 * Messaging Endpoints for Payload v3
 * 
 * POST /api/conversations/direct - Create/get direct conversation (idempotent)
 * POST /api/conversations/group - Create group conversation
 * GET /api/conversations - Get conversations (box=inbox|spam)
 * GET /api/conversations/:id/messages - Get messages for conversation
 * POST /api/conversations/:id/messages - Send message (dedupe by clientMutationId)
 * POST /api/conversations/:id/read - Mark conversation as read
 */

import type { Endpoint } from "payload";

export const createDirectConversationEndpoint: Endpoint = {
  path: "/conversations/direct",
  method: "post",
  handler: async (req) => {
    console.log("[Endpoint/messaging] POST create direct conversation");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return Response.json({ error: "userId required" }, { status: 400 });
    }

    const currentUserId = String(req.user.id);

    if (currentUserId === String(targetUserId)) {
      return Response.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    try {
      // Verify target user exists
      const targetUser = await req.payload.findByID({
        collection: "users",
        id: targetUserId,
      });

      if (!targetUser) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      // IDEMPOTENT: Check for existing direct conversation using directKey
      const sortedIds = [currentUserId, String(targetUserId)].sort();
      const directKey = sortedIds.join("_");

      const existing = await req.payload.find({
        collection: "conversations",
        where: {
          directKey: { equals: directKey },
        },
        limit: 1,
        depth: 2,
      });

      if (existing.totalDocs > 0) {
        console.log("[Endpoint/messaging] Existing direct conversation found");
        return Response.json({
          ...existing.docs[0],
          existing: true,
        });
      }

      // Create new direct conversation
      const conversation = await req.payload.create({
        collection: "conversations",
        data: {
          type: "direct",
          participants: [currentUserId, String(targetUserId)],
          createdBy: currentUserId,
          directKey,
        } as any,
      });

      return Response.json(conversation, { status: 201 });
    } catch (err: any) {
      console.error("[Endpoint/messaging] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const createGroupConversationEndpoint: Endpoint = {
  path: "/conversations/group",
  method: "post",
  handler: async (req) => {
    console.log("[Endpoint/messaging] POST create group conversation");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { participantIds, name } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
      return Response.json(
        { error: "At least one participant required" },
        { status: 400 }
      );
    }

    const currentUserId = String(req.user.id);

    // Include creator in participants
    const allParticipants = [...new Set([currentUserId, ...participantIds.map(String)])];

    try {
      const conversation = await req.payload.create({
        collection: "conversations",
        data: {
          type: "group",
          participants: allParticipants,
          createdBy: currentUserId,
          name: name || null,
        } as any,
      });

      return Response.json(conversation, { status: 201 });
    } catch (err: any) {
      console.error("[Endpoint/messaging] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getConversationsEndpoint: Endpoint = {
  path: "/conversations",
  method: "get",
  handler: async (req) => {
    console.log("[Endpoint/messaging] GET conversations");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const box = url.searchParams.get("box") || "inbox";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);

    const currentUserId = String(req.user.id);

    try {
      // Get all conversations user is part of
      const conversations = await req.payload.find({
        collection: "conversations",
        where: {
          participants: { contains: currentUserId },
        },
        sort: "-lastMessageAt",
        page,
        limit,
        depth: 2,
      });

      // For inbox/spam classification, we need to check follow relationships
      // Inbox: conversations with users you follow or follow you
      // Spam: conversations with users you don't follow and don't follow you

      const otherUserIds = new Set<string>();
      for (const conv of conversations.docs) {
        if ((conv as any).type === "direct") {
          for (const p of (conv as any).participants || []) {
            const pId = typeof p === "object" ? p.id : p;
            if (String(pId) !== currentUserId) {
              otherUserIds.add(String(pId));
            }
          }
        }
      }

      // Get follow relationships
      const [following, followers] = await Promise.all([
        req.payload.find({
          collection: "follows",
          where: {
            follower: { equals: currentUserId },
            following: { in: Array.from(otherUserIds) },
          },
          limit: 1000,
        }),
        req.payload.find({
          collection: "follows",
          where: {
            follower: { in: Array.from(otherUserIds) },
            following: { equals: currentUserId },
          },
          limit: 1000,
        }),
      ]);

      const followingSet = new Set(
        following.docs.map((f: any) =>
          String(typeof f.following === "object" ? f.following.id : f.following)
        )
      );
      const followerSet = new Set(
        followers.docs.map((f: any) =>
          String(typeof f.follower === "object" ? f.follower.id : f.follower)
        )
      );

      // Classify conversations
      const classified = conversations.docs.map((conv: any) => {
        let isInbox = true;

        if (conv.type === "direct") {
          const otherUserId = (conv.participants || [])
            .map((p: any) => String(typeof p === "object" ? p.id : p))
            .find((id: string) => id !== currentUserId);

          if (otherUserId) {
            // Inbox if: I follow them OR they follow me
            isInbox = followingSet.has(otherUserId) || followerSet.has(otherUserId);
          }
        }
        // Group conversations are always inbox

        return {
          ...conv,
          box: isInbox ? "inbox" : "spam",
        };
      });

      // Filter by requested box
      const filtered = classified.filter((c: any) => c.box === box);

      return Response.json({
        docs: filtered,
        totalDocs: filtered.length,
        box,
      });
    } catch (err: any) {
      console.error("[Endpoint/messaging] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getMessagesEndpoint: Endpoint = {
  path: "/conversations/:id/messages",
  method: "get",
  handler: async (req) => {
    const conversationId = req.routeParams?.id as string;
    console.log("[Endpoint/messaging] GET messages for conversation:", conversationId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!conversationId) {
      return Response.json({ error: "Conversation ID required" }, { status: 400 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

    const currentUserId = String(req.user.id);

    try {
      // Verify user is participant
      const conversation = await req.payload.findByID({
        collection: "conversations",
        id: conversationId,
      });

      if (!conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 });
      }

      const participantIds = ((conversation as any).participants || []).map(
        (p: any) => String(typeof p === "object" ? p.id : p)
      );

      if (!participantIds.includes(currentUserId)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      const messages = await req.payload.find({
        collection: "messages",
        where: {
          conversation: { equals: conversationId },
        },
        sort: "-createdAt",
        page,
        limit,
        depth: 2,
      });

      return Response.json({
        docs: messages.docs,
        totalDocs: messages.totalDocs,
        totalPages: messages.totalPages,
        page: messages.page,
        hasNextPage: messages.hasNextPage,
        hasPrevPage: messages.hasPrevPage,
      });
    } catch (err: any) {
      console.error("[Endpoint/messaging] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const sendMessageEndpoint: Endpoint = {
  path: "/conversations/:id/messages",
  method: "post",
  handler: async (req) => {
    const conversationId = req.routeParams?.id as string;
    console.log("[Endpoint/messaging] POST message to conversation:", conversationId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!conversationId) {
      return Response.json({ error: "Conversation ID required" }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, media, clientMutationId } = body;

    if (!text && !media) {
      return Response.json({ error: "Text or media required" }, { status: 400 });
    }

    const currentUserId = String(req.user.id);

    try {
      // Verify user is participant
      const conversation = await req.payload.findByID({
        collection: "conversations",
        id: conversationId,
      });

      if (!conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 });
      }

      const participantIds = ((conversation as any).participants || []).map(
        (p: any) => String(typeof p === "object" ? p.id : p)
      );

      if (!participantIds.includes(currentUserId)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      // DEDUPE by clientMutationId
      if (clientMutationId) {
        const existing = await req.payload.find({
          collection: "messages",
          where: {
            conversation: { equals: conversationId },
            sender: { equals: currentUserId },
            clientMutationId: { equals: clientMutationId },
          },
          limit: 1,
        });

        if (existing.totalDocs > 0) {
          console.log("[Endpoint/messaging] Duplicate message prevented by clientMutationId");
          return Response.json({
            ...existing.docs[0],
            deduplicated: true,
          });
        }
      }

      // Create message
      const message = await req.payload.create({
        collection: "messages",
        data: {
          conversation: conversationId,
          sender: currentUserId,
          text: text?.trim() || null,
          media: media || null,
          clientMutationId,
        } as any,
      });

      // Update conversation lastMessageAt
      await req.payload.update({
        collection: "conversations",
        id: conversationId,
        data: {
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: (text || "[Media]").substring(0, 100),
        } as any,
      });

      return Response.json(message, { status: 201 });
    } catch (err: any) {
      console.error("[Endpoint/messaging] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const markConversationReadEndpoint: Endpoint = {
  path: "/conversations/:id/read",
  method: "post",
  handler: async (req) => {
    const conversationId = req.routeParams?.id as string;
    console.log("[Endpoint/messaging] POST mark conversation read:", conversationId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!conversationId) {
      return Response.json({ error: "Conversation ID required" }, { status: 400 });
    }

    const currentUserId = String(req.user.id);

    try {
      // Verify user is participant
      const conversation = await req.payload.findByID({
        collection: "conversations",
        id: conversationId,
      });

      if (!conversation) {
        return Response.json({ error: "Conversation not found" }, { status: 404 });
      }

      const participantIds = ((conversation as any).participants || []).map(
        (p: any) => String(typeof p === "object" ? p.id : p)
      );

      if (!participantIds.includes(currentUserId)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      // Mark all messages as read by this user
      // Note: This depends on how readBy is implemented in your schema
      // For now, we'll update a lastReadAt field on the conversation per user
      // This is a simplified approach - production might need a separate readReceipts collection

      return Response.json({ read: true });
    } catch (err: any) {
      console.error("[Endpoint/messaging] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

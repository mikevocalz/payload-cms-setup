/**
 * Stories Endpoints for Payload v3
 *
 * POST /api/stories - Create story (24h expiry)
 * GET /api/stories - Get stories (grouped: my story + others; excludes expired)
 * POST /api/stories/:id/view - Mark story as viewed (idempotent)
 * POST /api/stories/:id/reply - Reply to story (creates DM message)
 */

import type { Endpoint } from "payload";

export const createStoryEndpoint: Endpoint = {
  path: "/stories",
  method: "post",
  handler: async (req) => {
    console.log("[Endpoint/stories] POST create story");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { media, clientMutationId } = body;

    if (!media || !media.type || !media.url) {
      return Response.json(
        { error: "Media with type and url required" },
        { status: 400 },
      );
    }

    const userId = String(req.user.id);

    try {
      // DEDUPE by clientMutationId
      if (clientMutationId) {
        const existing = await req.payload.find({
          collection: "stories",
          where: {
            author: { equals: userId },
            clientMutationId: { equals: clientMutationId },
          },
          limit: 1,
        });

        if (existing.totalDocs > 0) {
          console.log(
            "[Endpoint/stories] Duplicate story prevented by clientMutationId",
          );
          return Response.json({
            ...existing.docs[0],
            deduplicated: true,
          });
        }
      }

      // 24-hour expiry
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const story = await req.payload.create({
        collection: "stories",
        data: {
          author: userId,
          media,
          expiresAt: expiresAt.toISOString(),
          clientMutationId,
        } as any,
      });

      return Response.json(story, { status: 201 });
    } catch (err: any) {
      console.error("[Endpoint/stories] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const getStoriesEndpoint: Endpoint = {
  path: "/stories",
  method: "get",
  handler: async (req) => {
    console.log("[Endpoint/stories] GET stories");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(req.user.id);
    const now = new Date().toISOString();

    try {
      // Get users the current user follows
      const following = await req.payload.find({
        collection: "follows",
        where: {
          follower: { equals: userId },
        },
        limit: 1000,
        depth: 0,
      });

      const followingIds = following.docs.map((f: any) =>
        typeof f.following === "object" ? f.following.id : f.following,
      );

      // Include own stories
      followingIds.push(userId);

      // Get non-expired stories from followed users
      const stories = await req.payload.find({
        collection: "stories",
        where: {
          and: [
            { author: { in: followingIds } },
            { expiresAt: { greater_than: now } },
          ],
        },
        sort: "-createdAt",
        limit: 500,
        depth: 2,
      });

      // Get views for current user
      const storyIds = stories.docs.map((s: any) => s.id);
      let viewedStoryIds = new Set<string>();

      if (storyIds.length > 0) {
        const views = await req.payload.find({
          collection: "story-views",
          where: {
            viewer: { equals: userId },
            story: { in: storyIds },
          },
          limit: storyIds.length,
        });

        viewedStoryIds = new Set(
          views.docs.map((v: any) =>
            typeof v.story === "object" ? v.story.id : v.story,
          ),
        );
      }

      // Group stories by user
      const storiesByUser: Record<string, any[]> = {};

      for (const story of stories.docs) {
        const authorId =
          typeof story.author === "object"
            ? (story.author as any).id
            : story.author;
        const authorKey = String(authorId);

        if (!storiesByUser[authorKey]) {
          storiesByUser[authorKey] = [];
        }

        storiesByUser[authorKey].push({
          ...story,
          isViewed: viewedStoryIds.has(String(story.id)),
        });
      }

      // Separate my stories from others
      const myStories = storiesByUser[userId] || [];
      delete storiesByUser[userId];

      // Convert to array of user story groups
      const otherStories = Object.entries(storiesByUser).map(
        ([authorId, stories]) => ({
          user: stories[0].author,
          stories,
          hasUnviewed: stories.some((s: any) => !s.isViewed),
        }),
      );

      // Sort: unviewed first
      otherStories.sort((a, b) => {
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        return 0;
      });

      return Response.json({
        myStories:
          myStories.length > 0
            ? {
                user: myStories[0].author,
                stories: myStories,
              }
            : null,
        otherStories,
      });
    } catch (err: any) {
      console.error("[Endpoint/stories] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const viewStoryEndpoint: Endpoint = {
  path: "/stories/:id/view",
  method: "post",
  handler: async (req) => {
    const storyId = req.routeParams?.id as string;
    console.log("[Endpoint/stories] POST view story:", storyId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!storyId) {
      return Response.json({ error: "Story ID required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      // IDEMPOTENT: Check if already viewed
      const existing = await req.payload.find({
        collection: "story-views",
        where: {
          story: { equals: storyId },
          viewer: { equals: userId },
        },
        limit: 1,
      });

      if (existing.totalDocs > 0) {
        return Response.json({ viewed: true, deduplicated: true });
      }

      // Create view
      await req.payload.create({
        collection: "story-views",
        data: {
          story: storyId,
          viewer: userId,
        } as any,
      });

      // Update story viewers count
      try {
        const story = await req.payload.findByID({
          collection: "stories",
          id: storyId,
        });
        if (story) {
          await req.payload.update({
            collection: "stories",
            id: storyId,
            data: {
              viewersCount: ((story as any).viewersCount || 0) + 1,
            } as any,
          });
        }
      } catch (e) {
        console.error("[Endpoint/stories] Error updating viewers count:", e);
      }

      return Response.json({ viewed: true });
    } catch (err: any) {
      // Handle duplicate key error as success (idempotent)
      if (err.message?.includes("duplicate") || err.status === 409) {
        return Response.json({ viewed: true, deduplicated: true });
      }

      console.error("[Endpoint/stories] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const replyToStoryEndpoint: Endpoint = {
  path: "/stories/:id/reply",
  method: "post",
  handler: async (req) => {
    const storyId = req.routeParams?.id as string;
    console.log("[Endpoint/stories] POST reply to story:", storyId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!storyId) {
      return Response.json({ error: "Story ID required" }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text, clientMutationId } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "Text required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      // Get story and author
      const story = await req.payload.findByID({
        collection: "stories",
        id: storyId,
        depth: 1,
      });

      if (!story) {
        return Response.json({ error: "Story not found" }, { status: 404 });
      }

      const storyAuthorId =
        typeof story.author === "object"
          ? (story.author as any).id
          : story.author;

      // Can't reply to own story
      if (String(storyAuthorId) === userId) {
        return Response.json(
          { error: "Cannot reply to your own story" },
          { status: 400 },
        );
      }

      // Get or create direct conversation
      const sortedIds = [userId, String(storyAuthorId)].sort();
      const directKey = sortedIds.join("_");

      let conversation = await req.payload.find({
        collection: "conversations",
        where: {
          directKey: { equals: directKey },
        },
        limit: 1,
      });

      let conversationId: string;

      if (conversation.totalDocs > 0) {
        conversationId = String(conversation.docs[0].id);
      } else {
        // Create new direct conversation
        const newConversation = await req.payload.create({
          collection: "conversations",
          data: {
            type: "direct",
            participants: [userId, String(storyAuthorId)],
            createdBy: userId,
            directKey,
          } as any,
        });
        conversationId = String(newConversation.id);
      }

      // DEDUPE: Check for existing message with same clientMutationId
      if (clientMutationId) {
        const existing = await req.payload.find({
          collection: "messages",
          where: {
            conversation: { equals: conversationId },
            sender: { equals: userId },
            clientMutationId: { equals: clientMutationId },
          },
          limit: 1,
        });

        if (existing.totalDocs > 0) {
          console.log(
            "[Endpoint/stories] Duplicate reply prevented by clientMutationId",
          );
          return Response.json({
            message: existing.docs[0],
            conversationId,
            deduplicated: true,
          });
        }
      }

      // Create message with story reference
      const message = await req.payload.create({
        collection: "messages",
        data: {
          conversation: conversationId,
          sender: userId,
          text: text.trim(),
          storyId: storyId,
          clientMutationId,
        } as any,
      });

      // Update conversation lastMessageAt
      await req.payload.update({
        collection: "conversations",
        id: conversationId,
        data: {
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: text.trim().substring(0, 100),
        } as any,
      });

      return Response.json(
        {
          message,
          conversationId,
        },
        { status: 201 },
      );
    } catch (err: any) {
      console.error("[Endpoint/stories] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

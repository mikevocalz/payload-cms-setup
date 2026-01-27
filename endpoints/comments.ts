/**
 * Comments Endpoints for Payload v3
 * 
 * POST /api/posts/:id/comments - Create comment (with optional parentCommentId for replies)
 * GET /api/posts/:id/comments - Get comments for a post
 * 
 * INVARIANTS:
 * - Two-level threading only (replies to replies rejected)
 * - Dedupe by clientMutationId
 */

import type { Endpoint } from "payload";

export const createCommentEndpoint: Endpoint = {
  path: "/posts/:id/comments",
  method: "post",
  handler: async (req) => {
    const postId = req.routeParams?.id as string;
    console.log("[Endpoint/comments] POST comment for post:", postId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return Response.json({ error: "Post ID required" }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { content, parentCommentId, clientMutationId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "Content required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      // Verify post exists
      const post = await req.payload.findByID({
        collection: "posts",
        id: postId,
      });

      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      // INVARIANT: Two-level threading only
      if (parentCommentId) {
        const parentComment = await req.payload.findByID({
          collection: "comments",
          id: parentCommentId,
        });

        if (!parentComment) {
          return Response.json({ error: "Parent comment not found" }, { status: 404 });
        }

        // Check if parent is already a reply (has its own parent)
        if ((parentComment as any).parentComment || (parentComment as any).parent) {
          return Response.json(
            { error: "Cannot reply to a reply (two-level threading only)" },
            { status: 400 }
          );
        }
      }

      // DEDUPE: Check for existing comment with same clientMutationId
      if (clientMutationId) {
        const existing = await req.payload.find({
          collection: "comments",
          where: {
            author: { equals: userId },
            post: { equals: postId },
            clientMutationId: { equals: clientMutationId },
          },
          limit: 1,
        });

        if (existing.totalDocs > 0) {
          console.log("[Endpoint/comments] Duplicate comment prevented by clientMutationId");
          return Response.json({
            ...existing.docs[0],
            deduplicated: true,
          });
        }
      }

      // Create comment
      const commentData: any = {
        author: userId,
        post: postId,
        content: content.trim(),
        clientMutationId,
      };

      if (parentCommentId) {
        commentData.parentComment = parentCommentId;
      }

      const comment = await req.payload.create({
        collection: "comments",
        data: commentData,
      });

      // Update post comment count
      try {
        await req.payload.update({
          collection: "posts",
          id: postId,
          data: {
            commentsCount: ((post as any).commentsCount || 0) + 1,
          } as any,
        });
      } catch (e) {
        console.error("[Endpoint/comments] Error updating comment count:", e);
      }

      // Create notification for post author (if not self)
      const postAuthorId =
        typeof post.author === "object" ? (post.author as any).id : post.author;
      if (String(postAuthorId) !== userId) {
        try {
          await req.payload.create({
            collection: "notifications",
            data: {
              recipient: postAuthorId,
              actor: userId,
              type: "comment",
              entityType: "post",
              entityId: String(postId),
            } as any,
          });
        } catch (e) {
          console.error("[Endpoint/comments] Error creating notification:", e);
        }
      }

      return Response.json(comment, { status: 201 });
    } catch (err: any) {
      console.error("[Endpoint/comments] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getCommentsEndpoint: Endpoint = {
  path: "/posts/:id/comments",
  method: "get",
  handler: async (req) => {
    const postId = req.routeParams?.id as string;
    console.log("[Endpoint/comments] GET comments for post:", postId);

    if (!postId) {
      return Response.json({ error: "Post ID required" }, { status: 400 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

    try {
      // Get top-level comments (no parent)
      const topLevel = await req.payload.find({
        collection: "comments",
        where: {
          post: { equals: postId },
          parentComment: { exists: false },
        },
        sort: "-createdAt",
        page,
        limit,
        depth: 2, // Include author details
      });

      // Get all replies for these top-level comments
      const topLevelIds = topLevel.docs.map((c: any) => c.id);

      let replies: any[] = [];
      if (topLevelIds.length > 0) {
        const repliesResult = await req.payload.find({
          collection: "comments",
          where: {
            parentComment: { in: topLevelIds },
          },
          sort: "createdAt",
          limit: 500, // Get all replies
          depth: 2,
        });
        replies = repliesResult.docs;
      }

      // Group replies by parent
      const repliesByParent: Record<string, any[]> = {};
      for (const reply of replies) {
        const parentId =
          typeof reply.parentComment === "object"
            ? reply.parentComment.id
            : reply.parentComment;
        if (!repliesByParent[parentId]) {
          repliesByParent[parentId] = [];
        }
        repliesByParent[parentId].push(reply);
      }

      // Attach replies to top-level comments
      const commentsWithReplies = topLevel.docs.map((comment: any) => ({
        ...comment,
        replies: repliesByParent[comment.id] || [],
      }));

      return Response.json({
        docs: commentsWithReplies,
        totalDocs: topLevel.totalDocs,
        totalPages: topLevel.totalPages,
        page: topLevel.page,
        hasNextPage: topLevel.hasNextPage,
        hasPrevPage: topLevel.hasPrevPage,
      });
    } catch (err: any) {
      console.error("[Endpoint/comments] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

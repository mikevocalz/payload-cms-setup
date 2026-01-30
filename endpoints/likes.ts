/**
 * Like/Unlike Endpoints for Payload v3
 *
 * POST /api/posts/:id/like - Like a post (idempotent)
 * DELETE /api/posts/:id/like - Unlike a post (idempotent)
 * GET /api/posts/:id/like-state - Check like state
 *
 * Also supports comment likes:
 * POST /api/comments/:id/like
 * DELETE /api/comments/:id/like
 */

import type { Endpoint } from "payload";

export const likePostEndpoint: Endpoint = {
  path: "/posts/:id/like",
  method: "post",
  handler: async (req) => {
    const postId = req.routeParams?.id;
    console.log("[Endpoint/like] POST request for post:", postId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return Response.json({ error: "Post ID required" }, { status: 400 });
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

      // Create like - hooks handle duplicate prevention
      await req.payload.create({
        collection: "likes",
        data: {
          user: userId,
          post: postId,
        } as any,
      });

      console.log("[Endpoint/like] Like created successfully");

      // CRITICAL: Create notification for post author (if not self-like)
      const postAuthorId =
        typeof post.author === "object"
          ? String((post.author as any).id)
          : String(post.author);

      if (postAuthorId && postAuthorId !== userId) {
        try {
          await req.payload.create({
            collection: "notifications",
            data: {
              recipient: postAuthorId,
              actor: userId,
              type: "post_like",
              entityType: "post",
              entityId: postId,
              message: "liked your post",
              read: false,
            } as any,
          });
          console.log("[Endpoint/like] Notification created for post like");
        } catch (notifErr) {
          console.error(
            "[Endpoint/like] Failed to create notification:",
            notifErr,
          );
        }
      }

      // Get fresh count
      const freshPost = await req.payload.findByID({
        collection: "posts",
        id: postId,
      });

      return Response.json({
        liked: true,
        likesCount: (freshPost?.likesCount as number) || 0,
      });
    } catch (err: any) {
      // IDEMPOTENT: Already liked is success
      if (
        err.message === "User has already liked this post" ||
        err.status === 409
      ) {
        console.log("[Endpoint/like] Already liked, returning success");

        const post = await req.payload.findByID({
          collection: "posts",
          id: postId,
        });

        return Response.json({
          liked: true,
          likesCount: (post?.likesCount as number) || 0,
        });
      }

      console.error("[Endpoint/like] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const unlikePostEndpoint: Endpoint = {
  path: "/posts/:id/like",
  method: "delete",
  handler: async (req) => {
    const postId = req.routeParams?.id;
    console.log("[Endpoint/like] DELETE request for post:", postId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return Response.json({ error: "Post ID required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      // Find existing like
      const existing = await req.payload.find({
        collection: "likes",
        where: {
          user: { equals: userId },
          post: { equals: postId },
        },
        limit: 1,
      });

      // IDEMPOTENT: Not liked is success
      if (existing.totalDocs === 0) {
        console.log("[Endpoint/like] Not liked, returning success");

        const post = await req.payload.findByID({
          collection: "posts",
          id: postId,
        });

        return Response.json({
          liked: false,
          likesCount: (post?.likesCount as number) || 0,
        });
      }

      // Delete like - hooks handle count updates
      await req.payload.delete({
        collection: "likes",
        id: existing.docs[0].id,
      });

      console.log("[Endpoint/like] Unlike successful");

      // Get fresh count
      const freshPost = await req.payload.findByID({
        collection: "posts",
        id: postId,
      });

      return Response.json({
        liked: false,
        likesCount: (freshPost?.likesCount as number) || 0,
      });
    } catch (err: any) {
      console.error("[Endpoint/like] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const likeStateEndpoint: Endpoint = {
  path: "/posts/:id/like-state",
  method: "get",
  handler: async (req) => {
    const postId = req.routeParams?.id;

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return Response.json({ error: "Post ID required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      const [existing, post] = await Promise.all([
        req.payload.find({
          collection: "likes",
          where: {
            user: { equals: userId },
            post: { equals: postId },
          },
          limit: 1,
        }),
        req.payload.findByID({
          collection: "posts",
          id: postId,
        }),
      ]);

      return Response.json({
        liked: existing.totalDocs > 0,
        likesCount: (post?.likesCount as number) || 0,
      });
    } catch (err: any) {
      console.error("[Endpoint/like-state] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

// Comment like endpoints
export const likeCommentEndpoint: Endpoint = {
  path: "/comments/:id/like",
  method: "post",
  handler: async (req) => {
    const commentId = req.routeParams?.id;
    console.log("[Endpoint/like] POST request for comment:", commentId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!commentId) {
      return Response.json({ error: "Comment ID required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      // Create like - hooks handle duplicate prevention
      await req.payload.create({
        collection: "likes",
        data: {
          user: userId,
          comment: commentId,
        } as any,
      });

      const comment = await req.payload.findByID({
        collection: "comments",
        id: commentId,
      });

      return Response.json({
        liked: true,
        likesCount: (comment?.likesCount as number) || 0,
      });
    } catch (err: any) {
      // IDEMPOTENT
      if (
        err.message === "User has already liked this comment" ||
        err.status === 409
      ) {
        const comment = await req.payload.findByID({
          collection: "comments",
          id: commentId,
        });

        return Response.json({
          liked: true,
          likesCount: (comment?.likesCount as number) || 0,
        });
      }

      console.error("[Endpoint/like] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const unlikeCommentEndpoint: Endpoint = {
  path: "/comments/:id/like",
  method: "delete",
  handler: async (req) => {
    const commentId = req.routeParams?.id;

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!commentId) {
      return Response.json({ error: "Comment ID required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      const existing = await req.payload.find({
        collection: "likes",
        where: {
          user: { equals: userId },
          comment: { equals: commentId },
        },
        limit: 1,
      });

      if (existing.totalDocs === 0) {
        const comment = await req.payload.findByID({
          collection: "comments",
          id: commentId,
        });

        return Response.json({
          liked: false,
          likesCount: (comment?.likesCount as number) || 0,
        });
      }

      await req.payload.delete({
        collection: "likes",
        id: existing.docs[0].id,
      });

      const comment = await req.payload.findByID({
        collection: "comments",
        id: commentId,
      });

      return Response.json({
        liked: false,
        likesCount: (comment?.likesCount as number) || 0,
      });
    } catch (err: any) {
      console.error("[Endpoint/like] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

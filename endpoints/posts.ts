/**
 * Posts Endpoints for Payload v3
 * 
 * POST /api/posts - Create post
 * GET /api/posts/feed - Get feed
 * GET /api/posts/:id - Get single post
 * PATCH /api/posts/:id - Edit caption (Instagram parity)
 * DELETE /api/posts/:id - Delete post
 */

import type { Endpoint } from "payload";

export const createPostEndpoint: Endpoint = {
  path: "/posts",
  method: "post",
  handler: async (req) => {
    console.log("[Endpoint/posts] POST create post");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { caption, media, clientMutationId } = body;

    if (!media || !Array.isArray(media) || media.length === 0) {
      return Response.json(
        { error: "At least one media item required" },
        { status: 400 }
      );
    }

    // Validate media items
    for (const item of media) {
      if (!item.type || !["image", "video"].includes(item.type)) {
        return Response.json(
          { error: "Each media item must have type: 'image' or 'video'" },
          { status: 400 }
        );
      }
      if (!item.url) {
        return Response.json(
          { error: "Each media item must have a url" },
          { status: 400 }
        );
      }
    }

    const userId = String(req.user.id);

    try {
      // Dedupe by clientMutationId if provided
      if (clientMutationId) {
        const existing = await req.payload.find({
          collection: "posts",
          where: {
            author: { equals: userId },
            clientMutationId: { equals: clientMutationId },
          },
          limit: 1,
        });

        if (existing.totalDocs > 0) {
          console.log("[Endpoint/posts] Duplicate post prevented by clientMutationId");
          return Response.json({
            ...existing.docs[0],
            deduplicated: true,
          });
        }
      }

      const post = await req.payload.create({
        collection: "posts",
        data: {
          author: userId,
          caption: caption || "",
          media,
          clientMutationId,
        } as any,
      });

      // Update user's post count
      try {
        const user = await req.payload.findByID({
          collection: "users",
          id: userId,
        });
        await req.payload.update({
          collection: "users",
          id: userId,
          data: {
            postsCount: (user.postsCount || 0) + 1,
          },
        });
      } catch (e) {
        console.error("[Endpoint/posts] Error updating post count:", e);
      }

      return Response.json(post, { status: 201 });
    } catch (err: any) {
      console.error("[Endpoint/posts] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getFeedEndpoint: Endpoint = {
  path: "/posts/feed",
  method: "get",
  handler: async (req) => {
    console.log("[Endpoint/posts] GET feed");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 50);

    const userId = String(req.user.id);

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
        typeof f.following === "object" ? f.following.id : f.following
      );

      // Include own posts in feed
      followingIds.push(userId);

      const posts = await req.payload.find({
        collection: "posts",
        where: {
          author: { in: followingIds },
        },
        sort: "-createdAt",
        page,
        limit,
        depth: 2,
      });

      // Add like/bookmark state for current user
      const postIds = posts.docs.map((p: any) => p.id);

      const [likes, bookmarks] = await Promise.all([
        req.payload.find({
          collection: "likes",
          where: {
            user: { equals: userId },
            post: { in: postIds },
          },
          limit: postIds.length,
        }),
        req.payload.find({
          collection: "bookmarks",
          where: {
            user: { equals: userId },
            post: { in: postIds },
          },
          limit: postIds.length,
        }),
      ]);

      const likedPostIds = new Set(
        likes.docs.map((l: any) =>
          typeof l.post === "object" ? l.post.id : l.post
        )
      );
      const bookmarkedPostIds = new Set(
        bookmarks.docs.map((b: any) =>
          typeof b.post === "object" ? b.post.id : b.post
        )
      );

      const enrichedPosts = posts.docs.map((post: any) => ({
        ...post,
        isLiked: likedPostIds.has(post.id),
        isBookmarked: bookmarkedPostIds.has(post.id),
      }));

      return Response.json({
        docs: enrichedPosts,
        totalDocs: posts.totalDocs,
        totalPages: posts.totalPages,
        page: posts.page,
        hasNextPage: posts.hasNextPage,
        hasPrevPage: posts.hasPrevPage,
      });
    } catch (err: any) {
      console.error("[Endpoint/feed] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getPostEndpoint: Endpoint = {
  path: "/posts/:id",
  method: "get",
  handler: async (req) => {
    const postId = req.routeParams?.id as string;
    console.log("[Endpoint/posts] GET post:", postId);

    if (!postId) {
      return Response.json({ error: "Post ID required" }, { status: 400 });
    }

    try {
      const post = await req.payload.findByID({
        collection: "posts",
        id: postId,
        depth: 2,
      });

      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      // Add like/bookmark state if authenticated
      let isLiked = false;
      let isBookmarked = false;

      if (req.user) {
        const userId = String(req.user.id);

        const [like, bookmark] = await Promise.all([
          req.payload.find({
            collection: "likes",
            where: {
              user: { equals: userId },
              post: { equals: postId },
            },
            limit: 1,
          }),
          req.payload.find({
            collection: "bookmarks",
            where: {
              user: { equals: userId },
              post: { equals: postId },
            },
            limit: 1,
          }),
        ]);

        isLiked = like.totalDocs > 0;
        isBookmarked = bookmark.totalDocs > 0;
      }

      return Response.json({
        ...post,
        isLiked,
        isBookmarked,
      });
    } catch (err: any) {
      console.error("[Endpoint/posts] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const updatePostEndpoint: Endpoint = {
  path: "/posts/:id",
  method: "patch",
  handler: async (req) => {
    const postId = req.routeParams?.id as string;
    console.log("[Endpoint/posts] PATCH post:", postId);

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

    try {
      const post = await req.payload.findByID({
        collection: "posts",
        id: postId,
      });

      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      // Check ownership
      const authorId =
        typeof post.author === "object" ? (post.author as any).id : post.author;
      if (String(authorId) !== String(req.user.id)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      // Instagram parity: Only caption is editable
      const updated = await req.payload.update({
        collection: "posts",
        id: postId,
        data: {
          caption: body.caption,
        },
      });

      return Response.json(updated);
    } catch (err: any) {
      console.error("[Endpoint/posts] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const deletePostEndpoint: Endpoint = {
  path: "/posts/:id",
  method: "delete",
  handler: async (req) => {
    const postId = req.routeParams?.id as string;
    console.log("[Endpoint/posts] DELETE post:", postId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return Response.json({ error: "Post ID required" }, { status: 400 });
    }

    try {
      const post = await req.payload.findByID({
        collection: "posts",
        id: postId,
      });

      if (!post) {
        return Response.json({ error: "Post not found" }, { status: 404 });
      }

      // Check ownership
      const authorId =
        typeof post.author === "object" ? (post.author as any).id : post.author;
      if (String(authorId) !== String(req.user.id)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      await req.payload.delete({
        collection: "posts",
        id: postId,
      });

      // Update user's post count
      const userId = String(req.user.id);
      try {
        const user = await req.payload.findByID({
          collection: "users",
          id: userId,
        });
        await req.payload.update({
          collection: "users",
          id: userId,
          data: {
            postsCount: Math.max((user.postsCount || 0) - 1, 0),
          },
        });
      } catch (e) {
        console.error("[Endpoint/posts] Error updating post count:", e);
      }

      return Response.json({ deleted: true });
    } catch (err: any) {
      console.error("[Endpoint/posts] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

/**
 * Bookmark Endpoints for Payload v3
 * 
 * POST /api/posts/:id/bookmark - Bookmark a post (idempotent)
 * DELETE /api/posts/:id/bookmark - Unbookmark a post (idempotent)
 * GET /api/users/me/bookmarks - Get user's bookmarks
 */

import type { Endpoint } from "payload";

export const bookmarkPostEndpoint: Endpoint = {
  path: "/posts/:id/bookmark",
  method: "post",
  handler: async (req) => {
    const postId = req.routeParams?.id;
    console.log("[Endpoint/bookmark] POST request for post:", postId);

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

      // Create bookmark - hooks handle duplicate prevention
      const bookmark = await req.payload.create({
        collection: "bookmarks",
        data: {
          user: userId,
          post: postId,
        } as any,
      });

      console.log("[Endpoint/bookmark] Bookmark created successfully");

      return Response.json({
        bookmarked: true,
        bookmarkId: bookmark.id,
      });
    } catch (err: any) {
      // IDEMPOTENT: Already bookmarked is success
      if (
        err.message === "User has already bookmarked this post" ||
        err.status === 409
      ) {
        console.log("[Endpoint/bookmark] Already bookmarked, returning success");

        // Find existing bookmark
        const existing = await req.payload.find({
          collection: "bookmarks",
          where: {
            user: { equals: userId },
            post: { equals: postId },
          },
          limit: 1,
        });

        return Response.json({
          bookmarked: true,
          bookmarkId: existing.docs[0]?.id,
        });
      }

      console.error("[Endpoint/bookmark] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const unbookmarkPostEndpoint: Endpoint = {
  path: "/posts/:id/bookmark",
  method: "delete",
  handler: async (req) => {
    const postId = req.routeParams?.id;
    console.log("[Endpoint/bookmark] DELETE request for post:", postId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!postId) {
      return Response.json({ error: "Post ID required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      // Find existing bookmark
      const existing = await req.payload.find({
        collection: "bookmarks",
        where: {
          user: { equals: userId },
          post: { equals: postId },
        },
        limit: 1,
      });

      // IDEMPOTENT: Not bookmarked is success
      if (existing.totalDocs === 0) {
        console.log("[Endpoint/bookmark] Not bookmarked, returning success");

        return Response.json({
          bookmarked: false,
        });
      }

      // Delete bookmark
      await req.payload.delete({
        collection: "bookmarks",
        id: existing.docs[0].id,
      });

      console.log("[Endpoint/bookmark] Unbookmark successful");

      return Response.json({
        bookmarked: false,
      });
    } catch (err: any) {
      console.error("[Endpoint/bookmark] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getUserBookmarksEndpoint: Endpoint = {
  path: "/users/me/bookmarks",
  method: "get",
  handler: async (req) => {
    console.log("[Endpoint/bookmarks] GET user bookmarks");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(req.user.id);
    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

    try {
      const bookmarks = await req.payload.find({
        collection: "bookmarks",
        where: {
          user: { equals: userId },
        },
        sort: "-createdAt",
        page,
        limit,
        depth: 2, // Include post details
      });

      // Transform to include post data
      const posts = bookmarks.docs
        .map((bookmark: any) => {
          if (!bookmark.post || typeof bookmark.post === "number") {
            return null;
          }
          return {
            ...bookmark.post,
            bookmarkId: bookmark.id,
            bookmarkedAt: bookmark.createdAt,
          };
        })
        .filter(Boolean);

      return Response.json({
        docs: posts,
        totalDocs: bookmarks.totalDocs,
        totalPages: bookmarks.totalPages,
        page: bookmarks.page,
        hasNextPage: bookmarks.hasNextPage,
        hasPrevPage: bookmarks.hasPrevPage,
      });
    } catch (err: any) {
      console.error("[Endpoint/bookmarks] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const checkBookmarkStateEndpoint: Endpoint = {
  path: "/posts/:id/bookmark-state",
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
      const existing = await req.payload.find({
        collection: "bookmarks",
        where: {
          user: { equals: userId },
          post: { equals: postId },
        },
        limit: 1,
      });

      return Response.json({
        bookmarked: existing.totalDocs > 0,
        bookmarkId: existing.docs[0]?.id || null,
      });
    } catch (err: any) {
      console.error("[Endpoint/bookmark-state] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

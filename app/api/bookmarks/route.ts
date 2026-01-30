/**
 * Bookmarks API Route
 *
 * POST /api/bookmarks - Bookmark or unbookmark a post
 * GET  /api/bookmarks - Get user's bookmarks or check if post is bookmarked
 *
 * STABILIZED: Uses dedicated `bookmarks` collection with proper invariants.
 * - Idempotent: bookmark twice -> NOOP (200); unbookmark when none -> NOOP (200)
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

// Helper to get current user from headers - MUST pass raw headersList
async function getCurrentUser(payload: any, headersList: Headers) {
  try {
    const { user } = await payload.auth({ headers: headersList });
    return user;
  } catch (error) {
    console.error("[API/bookmarks] Auth error:", error);
    return null;
  }
}

export async function POST(request: Request) {
  console.log("[API/bookmarks] POST request received");

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    console.log("[API/bookmarks] Request body:", JSON.stringify(body));

    const { postId, action } = body;

    if (!postId || !action) {
      return Response.json(
        { error: "postId and action (bookmark/unbookmark) are required" },
        { status: 400 },
      );
    }

    if (action !== "bookmark" && action !== "unbookmark") {
      return Response.json(
        { error: "action must be 'bookmark' or 'unbookmark'" },
        { status: 400 },
      );
    }

    const currentUser = await getCurrentUser(payload, headersList);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = String(currentUser.id);
    const targetPostId = String(postId);

    // Verify post exists
    let targetPost;
    try {
      targetPost = await payload.findByID({
        collection: "posts",
        id: targetPostId,
      });
    } catch {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (!targetPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if bookmark exists
    const existingBookmark = await payload.find({
      collection: "bookmarks",
      where: {
        and: [{ user: { equals: userId } }, { post: { equals: targetPostId } }],
      },
      limit: 1,
    });

    const isBookmarked =
      existingBookmark.docs && existingBookmark.docs.length > 0;

    if (action === "bookmark") {
      if (isBookmarked) {
        console.log(
          "[API/bookmarks] Already bookmarked, returning current state",
        );
        return Response.json({
          message: "Already bookmarked",
          bookmarked: true,
        });
      }

      try {
        await payload.create({
          collection: "bookmarks",
          data: {
            user: userId,
            post: targetPostId,
          } as any,
        });

        console.log("[API/bookmarks] Bookmark created:", {
          userId,
          postId: targetPostId,
        });

        return Response.json({
          message: "Post bookmarked successfully",
          bookmarked: true,
        });
      } catch (createError: any) {
        if (createError.status === 409) {
          return Response.json({
            message: "Already bookmarked",
            bookmarked: true,
          });
        }
        throw createError;
      }
    } else {
      // UNBOOKMARK
      if (!isBookmarked) {
        console.log("[API/bookmarks] Not bookmarked, returning current state");
        return Response.json({
          message: "Not bookmarked",
          bookmarked: false,
        });
      }

      const bookmarkId = (existingBookmark.docs[0] as any).id;
      await payload.delete({
        collection: "bookmarks",
        id: bookmarkId,
      });

      console.log("[API/bookmarks] Bookmark deleted:", {
        bookmarkId,
        userId,
        postId: targetPostId,
      });

      return Response.json({
        message: "Post unbookmarked successfully",
        bookmarked: false,
      });
    }
  } catch (error: any) {
    console.error("[API/bookmarks] Error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();

    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");
    const userFilter = url.searchParams.get("where[user][equals]");
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);

    const currentUser = await getCurrentUser(payload, headersList);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = String(currentUser.id);

    // If postId provided, check if specific post is bookmarked
    if (postId) {
      const existingBookmark = await payload.find({
        collection: "bookmarks",
        where: {
          and: [{ user: { equals: userId } }, { post: { equals: postId } }],
        },
        limit: 1,
      });

      const isBookmarked =
        existingBookmark.docs && existingBookmark.docs.length > 0;
      return Response.json({ bookmarked: isBookmarked });
    }

    // Otherwise, return user's bookmarks
    const targetUserId = userFilter || userId;

    const bookmarks = await payload.find({
      collection: "bookmarks",
      where: {
        user: { equals: targetUserId },
      },
      limit,
      depth: 1,
      sort: "-createdAt",
    });

    return Response.json(bookmarks);
  } catch (error: any) {
    console.error("[API/bookmarks] GET error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}

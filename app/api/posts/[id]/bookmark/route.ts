/**
 * Bookmark Post API Route
 *
 * POST /api/posts/:id/bookmark - Bookmark or unbookmark a post
 * GET  /api/posts/:id/bookmark - Check if post is bookmarked
 *
 * STABILIZED: Uses dedicated `bookmarks` collection with idempotency.
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

// Helper to get current user from JWT token
async function getCurrentUser(payload: any, authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("JWT ")) {
    return null;
  }

  const token = authHeader.replace("JWT ", "");

  try {
    const { user } = await payload.auth({ headers: { authorization: `JWT ${token}` } });
    return user;
  } catch (error) {
    console.error("[API/posts/bookmark] Auth error:", error);
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  console.log("[API/posts/bookmark] POST request for post:", postId);

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { action?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Default to toggle behavior
    }

    const action = body.action || "bookmark";
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
        and: [
          { user: { equals: userId } },
          { post: { equals: targetPostId } },
        ],
      },
      limit: 1,
    });

    const isBookmarked = existingBookmark.docs && existingBookmark.docs.length > 0;

    if (action === "bookmark") {
      if (isBookmarked) {
        console.log("[API/posts/bookmark] Already bookmarked, idempotent return");
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

        console.log("[API/posts/bookmark] Bookmark created:", { userId, postId: targetPostId });

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
        console.log("[API/posts/bookmark] Not bookmarked, idempotent return");
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

      console.log("[API/posts/bookmark] Bookmark deleted:", { bookmarkId, userId, postId: targetPostId });

      return Response.json({
        message: "Post unbookmarked successfully",
        bookmarked: false,
      });
    }
  } catch (error: any) {
    console.error("[API/posts/bookmark] Error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(currentUser.id);
    const targetPostId = String(postId);

    const existingBookmark = await payload.find({
      collection: "bookmarks",
      where: {
        and: [
          { user: { equals: userId } },
          { post: { equals: targetPostId } },
        ],
      },
      limit: 1,
    });

    const isBookmarked = existingBookmark.docs && existingBookmark.docs.length > 0;
    return Response.json({ bookmarked: isBookmarked });
  } catch (error: any) {
    console.error("[API/posts/bookmark] GET error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

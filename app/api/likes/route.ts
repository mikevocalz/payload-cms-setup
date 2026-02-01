/**
 * Likes API Route
 *
 * POST /api/likes - Like or unlike a post
 * GET  /api/likes - Check if current user likes a post
 *
 * STABILIZED: Uses dedicated `likes` collection with proper invariants.
 * - Idempotent: like twice -> NOOP (200); unlike when none -> NOOP (200)
 * - Count updates handled by collection hooks
 */

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { headers } from "next/headers";

// Helper to get current user from JWT token
async function getCurrentUser(payload: any, authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("JWT ", "");

  try {
    const { user } = await payload.auth({
      headers: { authorization: `JWT ${token}` },
    });
    return user;
  } catch (error) {
    console.error("[API/likes] Auth error:", error);
    return null;
  }
}

export async function POST(request: Request) {
  console.log("[API/likes] POST request received");

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    console.log("[API/likes] Request body:", JSON.stringify(body));

    const { postId, action } = body;

    if (!postId || !action) {
      return Response.json(
        { error: "postId and action (like/unlike) are required" },
        { status: 400 },
      );
    }

    if (action !== "like" && action !== "unlike") {
      return Response.json(
        { error: "action must be 'like' or 'unlike'" },
        { status: 400 },
      );
    }

    const currentUser = await getCurrentUser(payload, authHeader);
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

    // Check if like exists
    const existingLike = await payload.find({
      collection: "likes",
      where: {
        and: [{ user: { equals: userId } }, { post: { equals: targetPostId } }],
      },
      limit: 1,
    });

    const isLiked = existingLike.docs && existingLike.docs.length > 0;

    if (action === "like") {
      if (isLiked) {
        console.log("[API/likes] Already liked, returning current state");
        return Response.json({
          message: "Already liked",
          liked: true,
          likesCount: (targetPost.likesCount as number) || 0,
        });
      }

      try {
        await payload.create({
          collection: "likes",
          data: {
            user: userId,
            post: targetPostId,
          } as any,
        });

        console.log("[API/likes] Like created:", {
          userId,
          postId: targetPostId,
        });

        // Get fresh count
        const freshPost = await payload.findByID({
          collection: "posts",
          id: targetPostId,
        });

        return Response.json({
          message: "Post liked successfully",
          liked: true,
          likesCount: (freshPost?.likesCount as number) || 0,
        });
      } catch (createError: any) {
        if (createError.status === 409) {
          return Response.json({
            message: "Already liked",
            liked: true,
            likesCount: (targetPost.likesCount as number) || 0,
          });
        }
        throw createError;
      }
    } else {
      // UNLIKE
      if (!isLiked) {
        console.log("[API/likes] Not liked, returning current state");
        return Response.json({
          message: "Not liked",
          liked: false,
          likesCount: (targetPost.likesCount as number) || 0,
        });
      }

      const likeId = (existingLike.docs[0] as any).id;
      await payload.delete({
        collection: "likes",
        id: likeId,
      });

      console.log("[API/likes] Like deleted:", {
        likeId,
        userId,
        postId: targetPostId,
      });

      const freshPost = await payload.findByID({
        collection: "posts",
        id: targetPostId,
      });

      return Response.json({
        message: "Post unliked successfully",
        liked: false,
        likesCount: (freshPost?.likesCount as number) || 0,
      });
    }
  } catch (error: any) {
    console.error("[API/likes] Error:", error);
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
    const authHeader = headersList.get("authorization");

    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");

    if (!postId) {
      return Response.json(
        { error: "postId query parameter is required" },
        { status: 400 },
      );
    }

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = String(currentUser.id);

    const existingLike = await payload.find({
      collection: "likes",
      where: {
        and: [{ user: { equals: userId } }, { post: { equals: postId } }],
      },
      limit: 1,
    });

    const isLiked = existingLike.docs && existingLike.docs.length > 0;

    return Response.json({ liked: isLiked });
  } catch (error: any) {
    console.error("[API/likes] GET error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 },
    );
  }
}

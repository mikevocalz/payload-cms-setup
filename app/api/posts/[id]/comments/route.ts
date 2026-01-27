/**
 * Post Comments API Route
 *
 * GET  /api/posts/:id/comments - Get comments for a post
 * POST /api/posts/:id/comments - Create a comment on a post
 *
 * STABILIZED: Uses `comments` collection with threading support.
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
    console.error("[API/posts/comments] Auth error:", error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  console.log("[API/posts/comments] GET request for post:", postId);

  try {
    const payload = await getPayload({ config: configPromise });
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    // Verify post exists
    let targetPost;
    try {
      targetPost = await payload.findByID({
        collection: "posts",
        id: postId,
      });
    } catch {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (!targetPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Get comments for this post
    const comments = await payload.find({
      collection: "comments",
      where: {
        post: { equals: postId },
      },
      sort: "-createdAt",
      page,
      limit,
      depth: 2,
    });

    return Response.json(comments);
  } catch (error: any) {
    console.error("[API/posts/comments] GET error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  console.log("[API/posts/comments] POST request for post:", postId);

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { content, parentId, clientMutationId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    // Verify post exists
    let targetPost;
    try {
      targetPost = await payload.findByID({
        collection: "posts",
        id: postId,
      });
    } catch {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    if (!targetPost) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // If clientMutationId provided, check for duplicate
    if (clientMutationId) {
      const existing = await payload.find({
        collection: "comments",
        where: {
          and: [
            { author: { equals: currentUser.id } },
            { post: { equals: postId } },
            { content: { equals: content.trim() } },
          ],
        },
        limit: 1,
        sort: "-createdAt",
      });

      // If same content posted within last 5 seconds, treat as duplicate
      if (existing.docs.length > 0) {
        const lastComment = existing.docs[0] as any;
        const lastCreated = new Date(lastComment.createdAt).getTime();
        const now = Date.now();
        if (now - lastCreated < 5000) {
          console.log("[API/posts/comments] Duplicate detected, returning existing");
          return Response.json({
            message: "Comment already exists",
            comment: lastComment,
            duplicate: true,
          });
        }
      }
    }

    // Create the comment
    const commentData: any = {
      author: currentUser.id,
      post: postId,
      content: content.trim(),
    };

    // If replying to a parent comment
    if (parentId) {
      commentData.parent = parentId;
    }

    const newComment = await payload.create({
      collection: "comments",
      data: commentData,
      depth: 2,
    });

    // Update post's comment count
    const currentCount = (targetPost as any).commentsCount || 0;
    await payload.update({
      collection: "posts",
      id: postId,
      data: {
        commentsCount: currentCount + 1,
      },
    });

    console.log("[API/posts/comments] Comment created:", newComment.id);

    return Response.json({
      message: "Comment created successfully",
      comment: newComment,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[API/posts/comments] POST error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

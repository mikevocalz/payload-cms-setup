/**
 * Post Like API Routes - CANONICAL ENDPOINTS
 * 
 * POST   /api/posts/:id/like - Like a post (idempotent)
 * DELETE /api/posts/:id/like - Unlike a post (idempotent)
 * 
 * IDEMPOTENCY GUARANTEE:
 * - POST when already liked -> returns current state (no-op, no error)
 * - DELETE when not liked -> returns current state (no-op, no error)
 * - Never creates duplicate likes
 * - Count is always derived from actual likes table
 */

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

// Helper: Get current like state and count
async function getLikeState(payload: any, userId: number, postId: number) {
  // Check if user has liked
  const existingLike = await payload.find({
    collection: "likes",
    where: {
      and: [
        { user: { equals: userId } },
        { post: { equals: postId } },
      ],
    },
    limit: 1,
  });

  const hasLiked = existingLike.docs.length > 0;
  const likeDoc = hasLiked ? existingLike.docs[0] : null;

  // Get accurate count from likes table (not stored count)
  const likesCount = await payload.find({
    collection: "likes",
    where: { post: { equals: postId } },
    limit: 0, // Just get count
  });

  return {
    hasLiked,
    likeDoc,
    likesCount: likesCount.totalDocs,
  };
}

// POST /api/posts/:id/like - Like a post
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const payload = await getPayload({ config });
  const headersList = await headers();

  try {
    const { user } = await payload.auth({ headers: headersList });
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(user.id);
    const postIdNum = Number(postId);

    if (isNaN(userId) || isNaN(postIdNum)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Check if post exists
    const post = await payload.findByID({
      collection: "posts",
      id: postIdNum,
    }).catch(() => null);

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Handle legacy { action: "like" | "unlike" } format
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // No body is fine for simple POST
    }

    // If action is "unlike", delegate to DELETE logic
    if (body.action === "unlike") {
      const { hasLiked, likeDoc, likesCount } = await getLikeState(payload, userId, postIdNum);
      
      if (hasLiked && likeDoc) {
        await payload.delete({
          collection: "likes",
          id: likeDoc.id,
        });
        // Recount after delete
        const newCount = await payload.find({
          collection: "likes",
          where: { post: { equals: postIdNum } },
          limit: 0,
        });
        return Response.json({
          hasLiked: false,
          liked: false,
          likesCount: newCount.totalDocs,
          likes: newCount.totalDocs,
        });
      }

      return Response.json({
        hasLiked: false,
        liked: false,
        likesCount,
        likes: likesCount,
      });
    }

    // LIKE operation
    const { hasLiked, likesCount } = await getLikeState(payload, userId, postIdNum);

    // IDEMPOTENT: If already liked, return current state (no error)
    if (hasLiked) {
      console.log(`[API/like] Already liked - idempotent return for post ${postId}`);
      return Response.json({
        hasLiked: true,
        liked: true,
        likesCount,
        likes: likesCount,
      });
    }

    // Create the like - hooks will update counts
    await payload.create({
      collection: "likes",
      data: {
        user: userId,
        post: postIdNum,
      },
    });

    // Get updated count
    const newCount = await payload.find({
      collection: "likes",
      where: { post: { equals: postIdNum } },
      limit: 0,
    });

    console.log(`[API/like] Liked post ${postId}, new count: ${newCount.totalDocs}`);

    return Response.json({
      hasLiked: true,
      liked: true,
      likesCount: newCount.totalDocs,
      likes: newCount.totalDocs,
    });
  } catch (err: any) {
    console.error("[API/like] Error:", err);
    
    // Handle duplicate like error gracefully (idempotent)
    if (err.message?.includes("already liked")) {
      const userId = Number((await payload.auth({ headers: headersList })).user?.id);
      const postIdNum = Number(postId);
      const { likesCount } = await getLikeState(payload, userId, postIdNum);
      
      return Response.json({
        hasLiked: true,
        liked: true,
        likesCount,
        likes: likesCount,
      });
    }

    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/:id/like - Unlike a post
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const payload = await getPayload({ config });
  const headersList = await headers();

  try {
    const { user } = await payload.auth({ headers: headersList });
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(user.id);
    const postIdNum = Number(postId);

    if (isNaN(userId) || isNaN(postIdNum)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { hasLiked, likeDoc, likesCount } = await getLikeState(payload, userId, postIdNum);

    // IDEMPOTENT: If not liked, return current state (no error)
    if (!hasLiked) {
      console.log(`[API/like] Not liked - idempotent return for post ${postId}`);
      return Response.json({
        hasLiked: false,
        liked: false,
        likesCount,
        likes: likesCount,
      });
    }

    // Delete the like - hooks will update counts
    await payload.delete({
      collection: "likes",
      id: likeDoc.id,
    });

    // Get updated count
    const newCount = await payload.find({
      collection: "likes",
      where: { post: { equals: postIdNum } },
      limit: 0,
    });

    console.log(`[API/like] Unliked post ${postId}, new count: ${newCount.totalDocs}`);

    return Response.json({
      hasLiked: false,
      liked: false,
      likesCount: newCount.totalDocs,
      likes: newCount.totalDocs,
    });
  } catch (err: any) {
    console.error("[API/like DELETE] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/posts/:id/like - Get like state (for like-state endpoint compatibility)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const payload = await getPayload({ config });
  const headersList = await headers();

  try {
    const { user } = await payload.auth({ headers: headersList });
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(user.id);
    const postIdNum = Number(postId);

    if (isNaN(userId) || isNaN(postIdNum)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { hasLiked, likesCount } = await getLikeState(payload, userId, postIdNum);

    return Response.json({
      hasLiked,
      liked: hasLiked,
      likesCount,
      likes: likesCount,
    });
  } catch (err: any) {
    console.error("[API/like GET] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

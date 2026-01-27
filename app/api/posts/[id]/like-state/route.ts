/**
 * Post Like State API Route
 * GET /api/posts/:id/like-state - Get like state for a post
 * 
 * Returns: { hasLiked: boolean, likesCount: number }
 */

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

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

    // Check if user has liked
    const existingLike = await payload.find({
      collection: "likes",
      where: {
        and: [
          { user: { equals: userId } },
          { post: { equals: postIdNum } },
        ],
      },
      limit: 1,
    });

    const hasLiked = existingLike.docs.length > 0;

    // Get accurate count from likes table
    const likesCount = await payload.find({
      collection: "likes",
      where: { post: { equals: postIdNum } },
      limit: 0,
    });

    return Response.json({
      hasLiked,
      likesCount: likesCount.totalDocs,
    });
  } catch (err: any) {
    console.error("[API/like-state] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

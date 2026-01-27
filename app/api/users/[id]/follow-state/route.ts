/**
 * Follow State API Route
 * GET /api/users/:id/follow-state
 */

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params;
  const payload = await getPayload({ config });
  const headersList = await headers();

  try {
    const { user } = await payload.auth({ headers: headersList });
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followerId = Number(user.id);
    const followingId = Number(targetId);

    if (isNaN(followerId) || isNaN(followingId)) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const existing = await payload.find({
      collection: "follows",
      where: {
        follower: { equals: followerId },
        following: { equals: followingId },
      },
      limit: 1,
    });

    // Also check if target follows current user
    const reverseFollow = await payload.find({
      collection: "follows",
      where: {
        follower: { equals: followingId },
        following: { equals: followerId },
      },
      limit: 1,
    });

    return Response.json({
      isFollowing: existing.totalDocs > 0,
      isFollowedBy: reverseFollow.totalDocs > 0,
    });
  } catch (err: any) {
    console.error("[API/follow-state] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

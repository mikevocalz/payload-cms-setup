/**
 * User Profile API Route
 * GET /api/users/:id/profile
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
    const { user: currentUser } = await payload.auth({ headers: headersList });
    
    const targetUserId = Number(targetId);
    if (isNaN(targetUserId)) {
      return Response.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const targetUser = await payload.findByID({
      collection: "users",
      id: targetUserId,
      depth: 1,
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check follow state if authenticated
    let isFollowing = false;
    let isFollowedBy = false;
    const isOwnProfile = currentUser?.id === targetUserId;

    if (currentUser && !isOwnProfile) {
      const followCheck = await payload.find({
        collection: "follows",
        where: {
          follower: { equals: Number(currentUser.id) },
          following: { equals: targetUserId },
        },
        limit: 1,
      });
      isFollowing = followCheck.totalDocs > 0;

      const reverseCheck = await payload.find({
        collection: "follows",
        where: {
          follower: { equals: targetUserId },
          following: { equals: Number(currentUser.id) },
        },
        limit: 1,
      });
      isFollowedBy = reverseCheck.totalDocs > 0;
    }

    // Count posts
    const postsCount = await payload.find({
      collection: "posts",
      where: {
        author: { equals: targetUserId },
      },
      limit: 0,
    });

    // Build safe profile response
    const profile = {
      id: String(targetUser.id),
      username: (targetUser as any).username || "",
      displayName: (targetUser as any).name || (targetUser as any).firstName || (targetUser as any).username || "",
      bio: (targetUser as any).bio || "",
      avatar: (targetUser as any).avatar,
      avatarUrl: typeof (targetUser as any).avatar === "object" 
        ? (targetUser as any).avatar?.url 
        : (targetUser as any).avatar || "",
      followersCount: (targetUser as any).followersCount || 0,
      followingCount: (targetUser as any).followingCount || 0,
      postsCount: postsCount.totalDocs,
      isFollowing,
      isFollowedBy,
      isOwnProfile,
      verified: (targetUser as any).verified || false,
    };

    return Response.json(profile);
  } catch (err: any) {
    console.error("[API/profile] Error:", err);
    return Response.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Follow/Unfollow User API Route
 *
 * POST /api/users/follow - Follow or unfollow a user
 * GET  /api/users/follow - Check if current user follows a user
 *
 * STABILIZED: Uses dedicated `follows` collection with proper invariants.
 * - Idempotent: follow twice -> NOOP (200); unfollow when none -> NOOP (200)
 * - Count updates handled by collection hooks
 * - Notifications handled by collection hooks
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
    // Verify JWT and get user
    const { user } = await payload.auth({ headers: { authorization: `JWT ${token}` } });
    return user;
  } catch (error) {
    console.error("[API/follow] Auth error:", error);
    return null;
  }
}

export async function POST(request: Request) {
  console.log("[API/follow] POST request received");

  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    console.log("[API/follow] Request body:", JSON.stringify(body));

    if (!body || typeof body !== "object") {
      return Response.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { userId, action } = body;

    if (!userId || !action) {
      return Response.json(
        { error: "userId and action (follow/unfollow) are required" },
        { status: 400 }
      );
    }

    if (action !== "follow" && action !== "unfollow") {
      return Response.json(
        { error: "action must be 'follow' or 'unfollow'" },
        { status: 400 }
      );
    }

    // Get current user from JWT
    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const followerId = String(currentUser.id);
    const followingId = String(userId);

    console.log("[API/follow] Processing:", { followerId, followingId, action });

    // INVARIANT: User cannot follow themselves
    if (followerId === followingId) {
      console.error("[API/follow] INVARIANT: Self-follow attempted");
      return Response.json(
        {
          error: "Cannot follow yourself",
          code: "SELF_FOLLOW_FORBIDDEN",
        },
        { status: 409 }
      );
    }

    // Verify target user exists
    let targetUser;
    try {
      targetUser = await payload.findByID({
        collection: "users",
        id: followingId,
      });
    } catch {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if follow relationship exists
    const existingFollow = await payload.find({
      collection: "follows",
      where: {
        and: [
          { follower: { equals: followerId } },
          { following: { equals: followingId } },
        ],
      },
      limit: 1,
    });

    const isFollowing = existingFollow.docs && existingFollow.docs.length > 0;

    if (action === "follow") {
      // IDEMPOTENT: Already following -> return success with current state
      if (isFollowing) {
        console.log("[API/follow] Already following, returning current state");
        const freshTargetUser = await payload.findByID({
          collection: "users",
          id: followingId,
        });
        return Response.json({
          message: "Already following",
          following: true,
          followersCount: (freshTargetUser?.followersCount as number) || 0,
        });
      }

      // CREATE follow record
      try {
        await payload.create({
          collection: "follows",
          data: {
            follower: followerId,
            following: followingId,
          },
        });

        console.log("[API/follow] Follow created:", { followerId, followingId });

        // Get fresh count after hook updates
        const freshTargetUser = await payload.findByID({
          collection: "users",
          id: followingId,
        });

        return Response.json({
          message: "User followed successfully",
          following: true,
          followersCount: (freshTargetUser?.followersCount as number) || 0,
        });
      } catch (createError: any) {
        // Handle duplicate (409) gracefully
        if (createError.status === 409) {
          console.log("[API/follow] Duplicate follow prevented by hook");
          return Response.json({
            message: "Already following",
            following: true,
            followersCount: (targetUser.followersCount as number) || 0,
          });
        }
        throw createError;
      }
    } else {
      // UNFOLLOW
      // IDEMPOTENT: Not following -> return success with current state
      if (!isFollowing) {
        console.log("[API/follow] Not following, returning current state");
        return Response.json({
          message: "Not following",
          following: false,
          followersCount: (targetUser.followersCount as number) || 0,
        });
      }

      // DELETE follow record
      const followId = (existingFollow.docs[0] as any).id;
      await payload.delete({
        collection: "follows",
        id: followId,
      });

      console.log("[API/follow] Follow deleted:", { followId, followerId, followingId });

      // Get fresh count after hook updates
      const freshTargetUser = await payload.findByID({
        collection: "users",
        id: followingId,
      });

      return Response.json({
        message: "User unfollowed successfully",
        following: false,
        followersCount: (freshTargetUser?.followersCount as number) || 0,
      });
    }
  } catch (error: any) {
    console.error("[API/follow] Error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise });
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser(payload, authHeader);
    if (!currentUser || !currentUser.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const followerId = String(currentUser.id);
    const followingId = String(userId);

    const existingFollow = await payload.find({
      collection: "follows",
      where: {
        and: [
          { follower: { equals: followerId } },
          { following: { equals: followingId } },
        ],
      },
      limit: 1,
    });

    const isFollowing = existingFollow.docs && existingFollow.docs.length > 0;

    return Response.json({ following: isFollowing });
  } catch (error: any) {
    console.error("[API/follow] GET error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: error.status || 500 }
    );
  }
}

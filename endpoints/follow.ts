/**
 * Follow/Unfollow Endpoints for Payload v3
 *
 * POST /api/users/follow - Follow a user
 * DELETE /api/users/follow - Unfollow a user
 * GET /api/users/follow - Check if following a user
 *
 * CANONICAL IMPLEMENTATION:
 * - Idempotent: follow twice -> returns { following: true }
 * - Self-follow prevented by collection hooks
 * - Count updates handled by collection hooks
 */

import type { Endpoint } from "payload";

export const followEndpoint: Endpoint = {
  path: "/users/follow",
  method: "post",
  handler: async (req) => {
    console.log("[Endpoint/follow] POST request received");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Support both followingId and userId for compatibility
    const followingId = body?.followingId || body?.userId;

    if (!followingId) {
      return Response.json(
        { error: "followingId or userId required" },
        { status: 400 },
      );
    }

    const followerId = String(req.user.id);
    const targetId = String(followingId);

    console.log("[Endpoint/follow] Processing follow:", {
      followerId,
      targetId,
    });

    // Self-follow check (also enforced by collection hook)
    if (followerId === targetId) {
      return Response.json(
        { error: "Cannot follow yourself", code: "SELF_FOLLOW_FORBIDDEN" },
        { status: 409 },
      );
    }

    try {
      // Create follow - hooks handle duplicate prevention
      await req.payload.create({
        collection: "follows",
        data: {
          follower: followerId,
          following: targetId,
        } as any,
      });

      console.log("[Endpoint/follow] Follow created successfully");

      // CRITICAL: Create notification for the followed user
      try {
        await req.payload.create({
          collection: "notifications",
          data: {
            recipient: targetId,
            actor: followerId,
            type: "follow",
            message: "started following you",
            read: false,
          } as any,
        });
        console.log("[Endpoint/follow] Notification created for follow");
      } catch (notifErr) {
        // Don't fail the follow if notification fails
        console.error(
          "[Endpoint/follow] Failed to create notification:",
          notifErr,
        );
      }

      // CRITICAL: Compute counts dynamically from follows collection
      const [followersResult, followingResult] = await Promise.all([
        req.payload.find({
          collection: "follows",
          where: { following: { equals: targetId } },
          limit: 0,
        }),
        req.payload.find({
          collection: "follows",
          where: { follower: { equals: followerId } },
          limit: 0,
        }),
      ]);

      return Response.json({
        following: true,
        message: "User followed successfully",
        followersCount: followersResult.totalDocs,
        followingCount: followingResult.totalDocs,
      });
    } catch (err: any) {
      // IDEMPOTENT: Already following is success, not error
      if (
        err.message === "Already following this user" ||
        err.message === "Already following" ||
        err.status === 409
      ) {
        console.log("[Endpoint/follow] Already following, returning success");

        // CRITICAL: Compute counts dynamically
        const [followersResult, followingResult] = await Promise.all([
          req.payload.find({
            collection: "follows",
            where: { following: { equals: targetId } },
            limit: 0,
          }),
          req.payload.find({
            collection: "follows",
            where: { follower: { equals: followerId } },
            limit: 0,
          }),
        ]);

        return Response.json({
          following: true,
          message: "Already following",
          followersCount: followersResult.totalDocs,
          followingCount: followingResult.totalDocs,
        });
      }

      console.error("[Endpoint/follow] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const unfollowEndpoint: Endpoint = {
  path: "/users/follow",
  method: "delete",
  handler: async (req) => {
    console.log("[Endpoint/follow] DELETE request received");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Support both followingId and userId for compatibility
    const followingId = body?.followingId || body?.userId;

    if (!followingId) {
      return Response.json(
        { error: "followingId or userId required" },
        { status: 400 },
      );
    }

    const followerId = String(req.user.id);
    const targetId = String(followingId);

    console.log("[Endpoint/follow] Processing unfollow:", {
      followerId,
      targetId,
    });

    try {
      // Find existing follow
      const existing = await req.payload.find({
        collection: "follows",
        where: {
          follower: { equals: followerId },
          following: { equals: targetId },
        },
        limit: 1,
      });

      // IDEMPOTENT: Not following is success, not error
      if (existing.totalDocs === 0) {
        console.log("[Endpoint/follow] Not following, returning success");

        // CRITICAL: Compute counts dynamically
        const [followersResult, followingResult] = await Promise.all([
          req.payload.find({
            collection: "follows",
            where: { following: { equals: targetId } },
            limit: 0,
          }),
          req.payload.find({
            collection: "follows",
            where: { follower: { equals: followerId } },
            limit: 0,
          }),
        ]);

        return Response.json({
          following: false,
          message: "Not following",
          followersCount: followersResult.totalDocs,
          followingCount: followingResult.totalDocs,
        });
      }

      // Delete follow - hooks handle count updates
      await req.payload.delete({
        collection: "follows",
        id: existing.docs[0].id,
      });

      console.log("[Endpoint/follow] Unfollow successful");

      // CRITICAL: Compute counts dynamically from follows collection
      const [followersResult, followingResult] = await Promise.all([
        req.payload.find({
          collection: "follows",
          where: { following: { equals: targetId } },
          limit: 0,
        }),
        req.payload.find({
          collection: "follows",
          where: { follower: { equals: followerId } },
          limit: 0,
        }),
      ]);

      return Response.json({
        following: false,
        message: "User unfollowed successfully",
        followersCount: followersResult.totalDocs,
        followingCount: followingResult.totalDocs,
      });
    } catch (err: any) {
      console.error("[Endpoint/follow] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

export const checkFollowEndpoint: Endpoint = {
  path: "/users/follow",
  method: "get",
  handler: async (req) => {
    console.log("[Endpoint/follow] GET request received");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return Response.json(
        { error: "userId query parameter required" },
        { status: 400 },
      );
    }

    const followerId = String(req.user.id);
    const targetId = String(userId);

    try {
      const existing = await req.payload.find({
        collection: "follows",
        where: {
          follower: { equals: followerId },
          following: { equals: targetId },
        },
        limit: 1,
      });

      return Response.json({
        following: existing.totalDocs > 0,
      });
    } catch (err: any) {
      console.error("[Endpoint/follow] GET error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

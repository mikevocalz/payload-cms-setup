/**
 * Profile Endpoints for Payload v3
 * 
 * GET /api/users/:id/profile - Get user profile (public, safe shape)
 * PATCH /api/users/me - Update own profile
 * POST /api/users/me/avatar - Update avatar
 * GET /api/users/:id/posts - Get user's posts (profile grid)
 * GET /api/users/:id/follow-state - Get follow state with counts
 */

import type { Endpoint } from "payload";

export const getUserProfileEndpoint: Endpoint = {
  path: "/users/:id/profile",
  method: "get",
  handler: async (req) => {
    const userId = req.routeParams?.id as string;
    console.log("[Endpoint/profile] GET profile for user:", userId);

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    try {
      const user = await req.payload.findByID({
        collection: "users",
        id: userId,
        depth: 1,
      });

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      // Return safe public shape
      const profile = {
        id: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        bio: user.bio || "",
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
        postsCount: user.postsCount || 0,
        isPrivate: user.isPrivate || false,
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
      };

      // If authenticated, include follow state
      let isFollowing = false;
      let isFollowedBy = false;

      if (req.user) {
        const currentUserId = String(req.user.id);
        
        if (currentUserId !== String(userId)) {
          const [followingCheck, followedByCheck] = await Promise.all([
            req.payload.find({
              collection: "follows",
              where: {
                follower: { equals: currentUserId },
                following: { equals: userId },
              },
              limit: 1,
            }),
            req.payload.find({
              collection: "follows",
              where: {
                follower: { equals: userId },
                following: { equals: currentUserId },
              },
              limit: 1,
            }),
          ]);

          isFollowing = followingCheck.totalDocs > 0;
          isFollowedBy = followedByCheck.totalDocs > 0;
        }
      }

      return Response.json({
        ...profile,
        isFollowing,
        isFollowedBy,
        isOwnProfile: req.user ? String(req.user.id) === String(userId) : false,
      });
    } catch (err: any) {
      console.error("[Endpoint/profile] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const updateOwnProfileEndpoint: Endpoint = {
  path: "/users/me",
  method: "patch",
  handler: async (req) => {
    console.log("[Endpoint/profile] PATCH own profile");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const userId = String(req.user.id);

    // Allowlist of editable fields
    const allowedFields = ["displayName", "bio", "avatarUrl", "isPrivate"];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    try {
      const updated = await req.payload.update({
        collection: "users",
        id: userId,
        data: updateData,
      });

      return Response.json({
        id: updated.id,
        username: updated.username,
        displayName: updated.displayName,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        isPrivate: updated.isPrivate,
      });
    } catch (err: any) {
      console.error("[Endpoint/profile] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const updateAvatarEndpoint: Endpoint = {
  path: "/users/me/avatar",
  method: "post",
  handler: async (req) => {
    console.log("[Endpoint/profile] POST avatar");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { avatarUrl, avatar } = body;

    if (!avatarUrl && !avatar) {
      return Response.json(
        { error: "avatarUrl or avatar (media ID) required" },
        { status: 400 }
      );
    }

    const userId = String(req.user.id);

    try {
      const updateData: Record<string, any> = {};
      if (avatarUrl) updateData.avatarUrl = avatarUrl;
      if (avatar) updateData.avatar = avatar;

      const updated = await req.payload.update({
        collection: "users",
        id: userId,
        data: updateData,
      });

      return Response.json({
        avatarUrl: updated.avatarUrl,
        avatar: updated.avatar,
      });
    } catch (err: any) {
      console.error("[Endpoint/avatar] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getUserPostsEndpoint: Endpoint = {
  path: "/users/:id/posts",
  method: "get",
  handler: async (req) => {
    const userId = req.routeParams?.id as string;
    console.log("[Endpoint/profile] GET posts for user:", userId);

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);

    try {
      const posts = await req.payload.find({
        collection: "posts",
        where: {
          author: { equals: userId },
        },
        sort: "-createdAt",
        page,
        limit,
        depth: 1,
      });

      return Response.json({
        docs: posts.docs,
        totalDocs: posts.totalDocs,
        totalPages: posts.totalPages,
        page: posts.page,
        hasNextPage: posts.hasNextPage,
        hasPrevPage: posts.hasPrevPage,
      });
    } catch (err: any) {
      console.error("[Endpoint/posts] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getFollowStateEndpoint: Endpoint = {
  path: "/users/:id/follow-state",
  method: "get",
  handler: async (req) => {
    const userId = req.routeParams?.id as string;

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    const currentUserId = String(req.user.id);

    try {
      const [user, followingCheck, followedByCheck] = await Promise.all([
        req.payload.findByID({
          collection: "users",
          id: userId,
        }),
        req.payload.find({
          collection: "follows",
          where: {
            follower: { equals: currentUserId },
            following: { equals: userId },
          },
          limit: 1,
        }),
        req.payload.find({
          collection: "follows",
          where: {
            follower: { equals: userId },
            following: { equals: currentUserId },
          },
          limit: 1,
        }),
      ]);

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      return Response.json({
        isFollowing: followingCheck.totalDocs > 0,
        isFollowedBy: followedByCheck.totalDocs > 0,
        followersCount: user.followersCount || 0,
        followingCount: user.followingCount || 0,
      });
    } catch (err: any) {
      console.error("[Endpoint/follow-state] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

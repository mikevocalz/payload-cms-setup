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

      // Get avatar URL from relationship if populated
      let avatarUrl = null;
      if (user.avatar) {
        if (typeof user.avatar === "object" && "url" in user.avatar) {
          avatarUrl = (user.avatar as any).url;
        }
      }

      // CRITICAL: Compute counts DYNAMICALLY from follows collection
      // Do NOT rely on stored counts which may be stale or 0
      const [followersResult, followingResult, postsResult] = await Promise.all(
        [
          req.payload.count({
            collection: "follows",
            where: { following: { equals: userId } },
          }),
          req.payload.count({
            collection: "follows",
            where: { follower: { equals: userId } },
          }),
          req.payload.count({
            collection: "posts",
            where: { author: { equals: userId } },
          }),
        ],
      );

      const followersCount = followersResult.totalDocs;
      const followingCount = followingResult.totalDocs;
      const postsCount = postsResult.totalDocs;

      console.log("[Endpoint/profile] Computed counts for user:", userId, {
        followersCount,
        followingCount,
        postsCount,
      });

      // Return safe public shape using actual DB field names
      const profile = {
        id: user.id,
        username: user.username,
        name: user.firstName || user.username,
        displayName: user.firstName || user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio || "",
        avatar: avatarUrl,
        followersCount,
        followingCount,
        postsCount,
        verified: user.verified || false,
        pronouns: user.pronouns,
        location: user.location,
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
        { status: err.status || 500 },
      );
    }
  },
};

export const updateOwnProfileEndpoint: Endpoint = {
  path: "/profile/me",
  method: "patch",
  handler: async (req) => {
    console.log("[Endpoint/profile] PATCH own profile");

    if (!req.user) {
      console.log("[Endpoint/profile] No user in request");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const userId = String(req.user.id);
    console.log(
      "[Endpoint/profile] Updating user:",
      userId,
      "with body:",
      JSON.stringify(body),
    );

    // Build update data with actual DB field names
    const updateData: Record<string, any> = {};

    // Map 'name' to 'firstName'
    if (body.name !== undefined) {
      updateData.firstName = body.name;
    }
    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName;
    }
    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName;
    }

    // Bio maps directly
    if (body.bio !== undefined) {
      updateData.bio = body.bio;
    }

    // Location maps directly
    if (body.location !== undefined) {
      updateData.location = body.location;
    }

    // Pronouns maps directly
    if (body.pronouns !== undefined) {
      updateData.pronouns = body.pronouns;
    }

    // Avatar: client sends URL string, but DB expects media relationship
    // For now, we'll skip avatar updates via this endpoint
    // Avatar should be updated via /users/me/avatar endpoint
    // But if it's a URL string (from Bunny CDN), we can't store it in the relationship field
    // We'll need to handle this differently - for now just log it
    if (body.avatar !== undefined) {
      console.log(
        "[Endpoint/profile] Avatar URL received (not stored in relationship):",
        body.avatar,
      );
      // TODO: Could create a media record or store URL in a separate field
    }

    console.log(
      "[Endpoint/profile] Mapped updateData:",
      JSON.stringify(updateData),
    );

    if (Object.keys(updateData).length === 0) {
      // If only avatar was sent, return success since we logged it
      if (body.avatar !== undefined) {
        return Response.json({
          user: {
            id: req.user.id,
            message:
              "Avatar URL received but not stored (media relationship expected)",
          },
        });
      }
      console.log("[Endpoint/profile] No valid fields to update");
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    try {
      const updated = await req.payload.update({
        collection: "users",
        id: userId,
        data: updateData,
      });

      console.log("[Endpoint/profile] Update successful for user:", userId);

      // Get avatar URL from relationship if populated
      let avatarUrl = null;
      if (updated.avatar) {
        if (typeof updated.avatar === "object" && "url" in updated.avatar) {
          avatarUrl = (updated.avatar as any).url;
        }
      }

      return Response.json({
        user: {
          id: updated.id,
          username: updated.username,
          name: updated.firstName,
          firstName: updated.firstName,
          lastName: updated.lastName,
          bio: updated.bio,
          avatar: avatarUrl,
          location: updated.location,
          pronouns: updated.pronouns,
          verified: updated.verified,
        },
      });
    } catch (err: any) {
      console.error("[Endpoint/profile] Update error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
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

    // Accept avatar as media ID (the DB field is a relationship)
    const { avatar } = body;

    if (!avatar) {
      return Response.json(
        { error: "avatar (media ID) required" },
        { status: 400 },
      );
    }

    const userId = String(req.user.id);

    try {
      const updated = await req.payload.update({
        collection: "users",
        id: userId,
        data: { avatar },
      });

      // Get URL from populated avatar
      let avatarUrl = null;
      if (updated.avatar) {
        if (typeof updated.avatar === "object" && "url" in updated.avatar) {
          avatarUrl = (updated.avatar as any).url;
        }
      }

      return Response.json({
        avatar: avatarUrl,
      });
    } catch (err: any) {
      console.error("[Endpoint/avatar] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
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
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "20", 10),
      100,
    );

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
        { status: err.status || 500 },
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
      // Compute all counts and states in parallel
      const [
        user,
        followingCheck,
        followedByCheck,
        followersCount,
        followingCount,
      ] = await Promise.all([
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
        // CRITICAL: Compute counts dynamically
        req.payload.count({
          collection: "follows",
          where: { following: { equals: userId } },
        }),
        req.payload.count({
          collection: "follows",
          where: { follower: { equals: userId } },
        }),
      ]);

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      return Response.json({
        isFollowing: followingCheck.totalDocs > 0,
        isFollowedBy: followedByCheck.totalDocs > 0,
        followersCount: followersCount.totalDocs,
        followingCount: followingCount.totalDocs,
      });
    } catch (err: any) {
      console.error("[Endpoint/follow-state] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 },
      );
    }
  },
};

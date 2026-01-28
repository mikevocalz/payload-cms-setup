/**
 * Blocks Endpoints for Payload v3
 * 
 * GET /api/blocks/me - Get all users blocked by current user
 * POST /api/blocks - Block a user
 * DELETE /api/blocks/:id - Unblock a user
 * GET /api/blocks/check/:userId - Check if a user is blocked
 */

import type { Endpoint } from "payload";

// GET /api/blocks/me - Get blocked users for current user
export const getBlockedUsersEndpoint: Endpoint = {
  path: "/blocks/me",
  method: "get",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(req.user.id);
    const url = new URL(req.url || "", "http://localhost");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
    const page = parseInt(url.searchParams.get("page") || "1", 10);

    try {
      const result = await req.payload.find({
        collection: "blocks",
        where: {
          blocker: { equals: userId },
        },
        limit,
        page,
        depth: 2,
        sort: "-createdAt",
      });

      return Response.json(result);
    } catch (err: any) {
      console.error("[Endpoint/blocks] GET /blocks/me error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500 }
      );
    }
  },
};

// POST /api/blocks - Block a user
export const blockUserEndpoint: Endpoint = {
  path: "/blocks",
  method: "post",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(req.user.id);

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { blocked, reason } = body;

    if (!blocked) {
      return Response.json({ error: "blocked userId is required" }, { status: 400 });
    }

    // Cannot block yourself
    if (blocked === userId) {
      return Response.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    try {
      // Check if already blocked
      const existing = await req.payload.find({
        collection: "blocks",
        where: {
          blocker: { equals: userId },
          blocked: { equals: blocked },
        },
        limit: 1,
      });

      if (existing.totalDocs > 0) {
        return Response.json({ 
          ...existing.docs[0],
          alreadyBlocked: true 
        });
      }

      // Verify blocked user exists
      try {
        await req.payload.findByID({
          collection: "users",
          id: blocked,
        });
      } catch {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      // Create block
      const block = await req.payload.create({
        collection: "blocks",
        data: {
          blocker: userId,
          blocked: blocked,
          reason: reason || undefined,
        },
      });

      // Optionally: Also unfollow in both directions
      try {
        // Remove their follow of me
        await req.payload.delete({
          collection: "follows",
          where: {
            follower: { equals: blocked },
            following: { equals: userId },
          },
        });
        // Remove my follow of them
        await req.payload.delete({
          collection: "follows",
          where: {
            follower: { equals: userId },
            following: { equals: blocked },
          },
        });
      } catch (e) {
        // Ignore follow deletion errors
      }

      return Response.json(block, { status: 201 });
    } catch (err: any) {
      console.error("[Endpoint/blocks] POST /blocks error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500 }
      );
    }
  },
};

// DELETE /api/blocks/:id - Unblock a user
export const unblockUserEndpoint: Endpoint = {
  path: "/blocks/:id",
  method: "delete",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(req.user.id);
    const blockId = req.routeParams?.id as string;

    if (!blockId) {
      return Response.json({ error: "Block ID required" }, { status: 400 });
    }

    try {
      // Verify the block exists and belongs to this user
      const block = await req.payload.findByID({
        collection: "blocks",
        id: blockId,
      });

      const blockerId = typeof block.blocker === "object" 
        ? (block.blocker as any).id 
        : block.blocker;

      if (String(blockerId) !== userId) {
        return Response.json({ error: "Not authorized to unblock this user" }, { status: 403 });
      }

      // Delete the block
      await req.payload.delete({
        collection: "blocks",
        id: blockId,
      });

      return Response.json({ success: true });
    } catch (err: any) {
      console.error("[Endpoint/blocks] DELETE /blocks/:id error:", err);
      if (err.message?.includes("not found")) {
        return Response.json({ error: "Block not found" }, { status: 404 });
      }
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500 }
      );
    }
  },
};

// GET /api/blocks/check/:userId - Check if a user is blocked
export const checkBlockedEndpoint: Endpoint = {
  path: "/blocks/check/:userId",
  method: "get",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = String(req.user.id);
    const targetUserId = req.routeParams?.userId as string;

    if (!targetUserId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    try {
      const result = await req.payload.find({
        collection: "blocks",
        where: {
          blocker: { equals: currentUserId },
          blocked: { equals: targetUserId },
        },
        limit: 1,
      });

      if (result.totalDocs > 0) {
        return Response.json({ 
          blocked: true, 
          blockId: result.docs[0].id 
        });
      }

      return Response.json({ blocked: false });
    } catch (err: any) {
      console.error("[Endpoint/blocks] GET /blocks/check/:userId error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500 }
      );
    }
  },
};

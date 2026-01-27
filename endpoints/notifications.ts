/**
 * Notifications & Badges Endpoints for Payload v3
 * 
 * GET /api/notifications - Get user's notifications
 * POST /api/notifications/:id/read - Mark notification as read
 * POST /api/devices/register - Register/update push token
 * GET /api/badges - Get unread counts
 */

import type { Endpoint } from "payload";

export const getNotificationsEndpoint: Endpoint = {
  path: "/notifications",
  method: "get",
  handler: async (req) => {
    console.log("[Endpoint/notifications] GET notifications");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url || "", "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);
    const unreadOnly = url.searchParams.get("unread") === "true";

    const userId = String(req.user.id);

    try {
      const where: any = {
        recipient: { equals: userId },
      };

      if (unreadOnly) {
        where.readAt = { exists: false };
      }

      const notifications = await req.payload.find({
        collection: "notifications",
        where,
        sort: "-createdAt",
        page,
        limit,
        depth: 2,
      });

      return Response.json({
        docs: notifications.docs,
        totalDocs: notifications.totalDocs,
        totalPages: notifications.totalPages,
        page: notifications.page,
        hasNextPage: notifications.hasNextPage,
        hasPrevPage: notifications.hasPrevPage,
      });
    } catch (err: any) {
      console.error("[Endpoint/notifications] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const markNotificationReadEndpoint: Endpoint = {
  path: "/notifications/:id/read",
  method: "post",
  handler: async (req) => {
    const notificationId = req.routeParams?.id as string;
    console.log("[Endpoint/notifications] POST mark read:", notificationId);

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!notificationId) {
      return Response.json({ error: "Notification ID required" }, { status: 400 });
    }

    const userId = String(req.user.id);

    try {
      const notification = await req.payload.findByID({
        collection: "notifications",
        id: notificationId,
      });

      if (!notification) {
        return Response.json({ error: "Notification not found" }, { status: 404 });
      }

      // Check ownership
      const recipientId =
        typeof notification.recipient === "object"
          ? (notification.recipient as any).id
          : notification.recipient;

      if (String(recipientId) !== userId) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      // Mark as read
      await req.payload.update({
        collection: "notifications",
        id: notificationId,
        data: {
          readAt: new Date().toISOString(),
        } as any,
      });

      return Response.json({ read: true });
    } catch (err: any) {
      console.error("[Endpoint/notifications] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const registerDeviceEndpoint: Endpoint = {
  path: "/devices/register",
  method: "post",
  handler: async (req) => {
    console.log("[Endpoint/devices] POST register device");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any;
    try {
      body = await req.json?.();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { deviceId, expoPushToken, platform } = body;

    if (!deviceId || !expoPushToken) {
      return Response.json(
        { error: "deviceId and expoPushToken required" },
        { status: 400 }
      );
    }

    const userId = String(req.user.id);

    try {
      // UPSERT: Check for existing device
      const existing = await req.payload.find({
        collection: "user-devices",
        where: {
          user: { equals: userId },
          deviceId: { equals: deviceId },
        },
        limit: 1,
      });

      if (existing.totalDocs > 0) {
        // Update existing
        await req.payload.update({
          collection: "user-devices",
          id: existing.docs[0].id,
          data: {
            expoPushToken,
            platform: platform || null,
            lastSeenAt: new Date().toISOString(),
          } as any,
        });

        return Response.json({
          registered: true,
          updated: true,
          deviceId: existing.docs[0].id,
        });
      }

      // Create new
      const device = await req.payload.create({
        collection: "user-devices",
        data: {
          user: userId,
          deviceId,
          expoPushToken,
          platform: platform || null,
          lastSeenAt: new Date().toISOString(),
        } as any,
      });

      return Response.json({
        registered: true,
        deviceId: device.id,
      }, { status: 201 });
    } catch (err: any) {
      console.error("[Endpoint/devices] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

export const getBadgesEndpoint: Endpoint = {
  path: "/badges",
  method: "get",
  handler: async (req) => {
    console.log("[Endpoint/badges] GET badges");

    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(req.user.id);

    try {
      // Count unread notifications
      const unreadNotifications = await req.payload.count({
        collection: "notifications",
        where: {
          recipient: { equals: userId },
          readAt: { exists: false },
        },
      });

      // Count unread messages (simplified - messages in conversations where user is participant)
      // For proper implementation, need to track per-message read status
      // For now, we'll count conversations with messages newer than user's last read

      // Get user's conversations
      const conversations = await req.payload.find({
        collection: "conversations",
        where: {
          participants: { contains: userId },
        },
        limit: 100,
      });

      // Get follow relationships to determine inbox
      const conversationIds = conversations.docs.map((c: any) => c.id);
      
      let inboxUnread = 0;
      
      // Simplified: count conversations with recent messages as unread
      // Production implementation should track actual read status per message
      for (const conv of conversations.docs) {
        // Check if this is inbox (followed user) - simplified
        if ((conv as any).lastMessageAt) {
          const lastMsg = new Date((conv as any).lastMessageAt);
          const now = new Date();
          // Consider "unread" if message in last 24h (simplified)
          // Real implementation needs proper read tracking
          if (now.getTime() - lastMsg.getTime() < 24 * 60 * 60 * 1000) {
            // Check if we follow the other user (inbox classification)
            // For now, just count all recent conversations
            inboxUnread++;
          }
        }
      }

      return Response.json({
        notificationsUnread: unreadNotifications.totalDocs,
        messagesUnread: inboxUnread,
      });
    } catch (err: any) {
      console.error("[Endpoint/badges] Error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: err.status || 500 }
      );
    }
  },
};

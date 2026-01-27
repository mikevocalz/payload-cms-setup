/**
 * Notification Service
 * 
 * Centralized notification creation and push sending.
 * Enforces deduplication and atomic record creation.
 */

import type { Payload } from "payload";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface CreateNotificationInput {
  recipient: string | number;
  actor?: string | number;
  type: 
    | "follow"
    | "like_post"
    | "like_comment"
    | "comment_post"
    | "reply_comment"
    | "mention"
    | "message"
    | "story_reply"
    | "event_invite"
    | "system";
  entityType?: "post" | "comment" | "story" | "user" | "message" | "event";
  entityId?: string;
  conversationId?: string;
  text?: string;
  dedupeKey?: string;
  skipPush?: boolean;
}

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

/**
 * Generate a deterministic dedupe key for a notification
 */
export function generateDedupeKey(input: CreateNotificationInput): string {
  const actor = input.actor || "system";
  const entityId = input.entityId || "none";
  return `${input.type}:${entityId}:${actor}:${input.recipient}`;
}

/**
 * Create a notification record (with deduplication)
 * 
 * @returns The created notification or null if duplicate
 */
export async function createNotification(
  payload: Payload,
  input: CreateNotificationInput
): Promise<{ id: string | number; isDuplicate: boolean } | null> {
  const dedupeKey = input.dedupeKey || generateDedupeKey(input);

  try {
    const notification = await payload.create({
      collection: "notifications",
      data: {
        recipient: input.recipient,
        actor: input.actor,
        type: input.type,
        entityType: input.entityType,
        entityId: input.entityId,
        conversationId: input.conversationId,
        text: input.text,
        dedupeKey,
        pushStatus: "pending",
      },
    });

    console.log("[Notifications] Created:", {
      id: notification.id,
      type: input.type,
      recipient: input.recipient,
    });

    return { id: notification.id, isDuplicate: false };
  } catch (error: any) {
    // Handle duplicate (409 conflict)
    if (error.status === 409 && error.existingId) {
      console.log("[Notifications] Duplicate skipped:", dedupeKey);
      return { id: error.existingId, isDuplicate: true };
    }

    // Handle self-notification
    if (error.status === 400 && error.message?.includes("yourself")) {
      console.log("[Notifications] Self-notification skipped");
      return null;
    }

    console.error("[Notifications] Error creating notification:", error);
    throw error;
  }
}

/**
 * Send push notification to a user's devices
 */
export async function sendPushNotification(
  payload: Payload,
  userId: string | number,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  try {
    // Get user's active devices
    const devices = await payload.find({
      collection: "user-devices" as any,
      where: {
        and: [
          { user: { equals: userId } },
          { disabledAt: { exists: false } },
        ],
      },
      limit: 10, // Max 10 devices per user
    });

    if (devices.docs.length === 0) {
      console.log("[Push] No active devices for user:", userId);
      return { sent: 0, failed: 0 };
    }

    // Build push messages
    const messages: PushMessage[] = devices.docs
      .filter((device: any) => device.expoPushToken?.startsWith("ExponentPushToken["))
      .map((device: any) => ({
        to: device.expoPushToken,
        title,
        body,
        data,
        sound: "default" as const,
        channelId: "default",
      }));

    if (messages.length === 0) {
      console.log("[Push] No valid tokens for user:", userId);
      return { sent: 0, failed: 0 };
    }

    // Send to Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[Push] Expo API error:", error);
      return { sent: 0, failed: messages.length };
    }

    const result = await response.json();
    
    // Count successes and failures
    let sent = 0;
    let failed = 0;
    
    if (result.data && Array.isArray(result.data)) {
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "ok") {
          sent++;
        } else {
          failed++;
          // Disable invalid tokens
          if (ticket.details?.error === "DeviceNotRegistered") {
            const device = devices.docs[i] as any;
            console.log("[Push] Disabling invalid token:", device.deviceId);
            await payload.update({
              collection: "user-devices" as any,
              id: device.id,
              data: { disabledAt: new Date().toISOString() },
            });
          }
        }
      }
    }

    console.log("[Push] Sent:", sent, "Failed:", failed, "User:", userId);
    return { sent, failed };
  } catch (error) {
    console.error("[Push] Error sending notification:", error);
    return { sent: 0, failed: 1 };
  }
}

/**
 * Create notification AND send push (atomic pattern)
 */
export async function notifyUser(
  payload: Payload,
  input: CreateNotificationInput & {
    pushTitle: string;
    pushBody: string;
    pushData?: Record<string, unknown>;
  }
): Promise<void> {
  // Step 1: Create in-app notification record
  const result = await createNotification(payload, input);
  
  if (!result || result.isDuplicate) {
    return; // Duplicate or self-notification
  }

  // Step 2: Skip push if requested
  if (input.skipPush) {
    return;
  }

  // Step 3: Send push notification
  const pushResult = await sendPushNotification(
    payload,
    input.recipient as string,
    input.pushTitle,
    input.pushBody,
    {
      ...input.pushData,
      notificationId: result.id,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
    }
  );

  // Step 4: Update notification with push status
  try {
    await payload.update({
      collection: "notifications",
      id: result.id,
      data: {
        pushStatus: pushResult.sent > 0 ? "sent" : (pushResult.failed > 0 ? "failed" : "skipped"),
      },
    });
  } catch (e) {
    console.error("[Notifications] Error updating push status:", e);
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(
  payload: Payload,
  userId: string | number
): Promise<number> {
  const result = await payload.find({
    collection: "notifications",
    where: {
      and: [
        { recipient: { equals: userId } },
        { readAt: { exists: false } },
      ],
    },
    limit: 0, // Just count
  });

  return result.totalDocs;
}

/**
 * Mark notifications as read
 */
export async function markAsRead(
  payload: Payload,
  notificationIds: (string | number)[]
): Promise<void> {
  const now = new Date().toISOString();

  for (const id of notificationIds) {
    try {
      await payload.update({
        collection: "notifications",
        id,
        data: { readAt: now },
      });
    } catch (e) {
      console.error("[Notifications] Error marking as read:", id, e);
    }
  }
}

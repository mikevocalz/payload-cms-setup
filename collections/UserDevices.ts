/**
 * UserDevices Collection
 * 
 * Stores Expo push tokens per user/device for push notifications.
 * Supports multiple devices per user.
 */

import type { CollectionConfig } from "payload"

export const UserDevices: CollectionConfig = {
  slug: "user-devices",
  admin: {
    useAsTitle: "deviceId",
    defaultColumns: ["user", "platform", "lastSeenAt", "createdAt"],
    group: "System",
  },
  access: {
    // Only the user can read their own devices
    read: ({ req }) => {
      if (req.user) {
        return {
          user: { equals: req.user.id },
        }
      }
      return true // API key
    },
    // Allow create via registration endpoint
    create: () => true,
    // Only the user can update their devices
    update: ({ req }) => {
      if (req.user) {
        return {
          user: { equals: req.user.id },
        }
      }
      return true // API key
    },
    // Only the user can delete their devices
    delete: ({ req }) => {
      if (req.user) {
        return {
          user: { equals: req.user.id },
        }
      }
      return true // API key
    },
  },
  hooks: {
    // INVARIANT: One record per (user, deviceId) - upsert pattern
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;

          // Validate required fields
          if (!data?.user || !data?.deviceId || !data?.expoPushToken) {
            const error = new Error("user, deviceId, and expoPushToken are required");
            (error as any).status = 400;
            throw error;
          }

          // Validate Expo push token format
          if (!data.expoPushToken.startsWith("ExponentPushToken[")) {
            const error = new Error("Invalid Expo push token format");
            (error as any).status = 400;
            throw error;
          }

          // Check for existing device record
          const existing = await payload.find({
            collection: "user-devices",
            where: {
              and: [
                { user: { equals: data.user } },
                { deviceId: { equals: data.deviceId } },
              ],
            },
            limit: 1,
          });

          if (existing.docs.length > 0) {
            // Update existing record instead of creating duplicate
            console.log("[UserDevices] Updating existing device:", data.deviceId);
            const existingDoc = existing.docs[0] as any;
            
            await payload.update({
              collection: "user-devices",
              id: existingDoc.id,
              data: {
                expoPushToken: data.expoPushToken,
                platform: data.platform,
                lastSeenAt: new Date().toISOString(),
                disabledAt: null, // Re-enable if was disabled
              },
            });

            // Prevent duplicate creation by throwing a special error
            const error = new Error("Device updated");
            (error as any).status = 200;
            (error as any).existingId = existingDoc.id;
            (error as any).isUpdate = true;
            throw error;
          }

          // Set lastSeenAt for new device
          data.lastSeenAt = new Date().toISOString();

          console.log("[UserDevices] Registering new device:", {
            user: data.user,
            deviceId: data.deviceId,
            platform: data.platform,
          });
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "expoPushToken",
      type: "text",
      required: true,
      admin: {
        description: "Expo push token (ExponentPushToken[...])",
      },
    },
    {
      name: "deviceId",
      type: "text",
      required: true,
      index: true,
      admin: {
        description: "Unique device identifier",
      },
    },
    {
      name: "platform",
      type: "select",
      options: [
        { label: "iOS", value: "ios" },
        { label: "Android", value: "android" },
      ],
      required: true,
    },
    {
      name: "lastSeenAt",
      type: "date",
      index: true,
      admin: {
        description: "Last time this device was active",
      },
    },
    {
      name: "disabledAt",
      type: "date",
      admin: {
        description: "When push was disabled for this device (token invalid, etc.)",
      },
    },
    {
      name: "createdAt",
      type: "date",
      defaultValue: () => new Date(),
      admin: {
        readOnly: true,
      },
    },
  ],
  indexes: [
    {
      fields: ["user", "deviceId"],
      unique: true,
    },
  ],
}

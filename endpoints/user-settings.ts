/**
 * User Settings Endpoints for Payload v3
 *
 * GET /api/users/me/notification-prefs - Get notification preferences
 * PATCH /api/users/me/notification-prefs - Update notification preferences
 * GET /api/users/me/privacy - Get privacy settings
 * PATCH /api/users/me/privacy - Update privacy settings
 */

import type { Endpoint } from "payload";

// Default values
const DEFAULT_NOTIFICATION_PREFS = {
  pauseAll: false,
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  messages: true,
  liveVideos: false,
  emailNotifications: false,
};

const DEFAULT_PRIVACY_SETTINGS = {
  privateAccount: false,
  activityStatus: true,
  readReceipts: true,
  showLikes: true,
};

// Helper to get or create user settings
async function getOrCreateUserSettings(
  payload: any,
  userId: string,
  cookies?: string,
) {
  const settingsKey = `user_settings_${userId}`;

  try {
    const result = await payload.find({
      collection: "settings",
      where: {
        key: { equals: settingsKey },
      },
      limit: 1,
    });

    if (result.totalDocs > 0) {
      return result.docs[0];
    }

    // Create default settings
    const newSettings = await payload.create({
      collection: "settings",
      data: {
        key: settingsKey,
        value: {
          notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
          privacySettings: DEFAULT_PRIVACY_SETTINGS,
        },
        description: `Settings for user ${userId}`,
      },
    });

    return newSettings;
  } catch (err) {
    console.error("[user-settings] Error getting/creating settings:", err);
    throw err;
  }
}

// GET /api/users/me/notification-prefs
export const getNotificationPrefsEndpoint: Endpoint = {
  path: "/users/me/notification-prefs",
  method: "get",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(req.user.id);

    try {
      const settings = await getOrCreateUserSettings(req.payload, userId);
      const prefs =
        settings.value?.notificationPrefs || DEFAULT_NOTIFICATION_PREFS;

      return Response.json(prefs);
    } catch (err: any) {
      console.error(
        "[Endpoint/user-settings] GET notification-prefs error:",
        err,
      );
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500 },
      );
    }
  },
};

// PATCH /api/users/me/notification-prefs
export const updateNotificationPrefsEndpoint: Endpoint = {
  path: "/users/me/notification-prefs",
  method: "patch",
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

    try {
      const settings = await getOrCreateUserSettings(req.payload, userId);
      const currentPrefs =
        settings.value?.notificationPrefs || DEFAULT_NOTIFICATION_PREFS;

      // Merge new prefs with existing
      const updatedPrefs = {
        ...currentPrefs,
        ...body,
      };

      // Update settings
      const updated = await req.payload.update({
        collection: "settings",
        id: settings.id,
        data: {
          value: {
            ...settings.value,
            notificationPrefs: updatedPrefs,
          },
          updatedAt: new Date().toISOString(),
        },
      });

      return Response.json(updatedPrefs);
    } catch (err: any) {
      console.error(
        "[Endpoint/user-settings] PATCH notification-prefs error:",
        err,
      );
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500 },
      );
    }
  },
};

// GET /api/users/me/privacy
export const getPrivacySettingsEndpoint: Endpoint = {
  path: "/users/me/privacy",
  method: "get",
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = String(req.user.id);

    try {
      const settings = await getOrCreateUserSettings(req.payload, userId);
      const privacy =
        settings.value?.privacySettings || DEFAULT_PRIVACY_SETTINGS;

      return Response.json(privacy);
    } catch (err: any) {
      console.error("[Endpoint/user-settings] GET privacy error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500 },
      );
    }
  },
};

// PATCH /api/users/me/privacy
export const updatePrivacySettingsEndpoint: Endpoint = {
  path: "/users/me/privacy",
  method: "patch",
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

    try {
      const settings = await getOrCreateUserSettings(req.payload, userId);
      const currentPrivacy =
        settings.value?.privacySettings || DEFAULT_PRIVACY_SETTINGS;

      // Merge new settings with existing
      const updatedPrivacy = {
        ...currentPrivacy,
        ...body,
      };

      // Update settings
      const updated = await req.payload.update({
        collection: "settings",
        id: settings.id,
        data: {
          value: {
            ...settings.value,
            privacySettings: updatedPrivacy,
          },
          updatedAt: new Date().toISOString(),
        },
      });

      return Response.json(updatedPrivacy);
    } catch (err: any) {
      console.error("[Endpoint/user-settings] PATCH privacy error:", err);
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500 },
      );
    }
  },
};

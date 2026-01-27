import type { CollectionConfig } from "payload";

export const Notifications: CollectionConfig = {
  slug: "notifications",
  admin: {
    defaultColumns: ["recipient", "type", "actor", "text", "createdAt"],
  },
  access: {
    // STRICT: Only recipient can read their notifications
    read: ({ req }) => {
      if (req.user) {
        return {
          recipient: { equals: req.user.id },
        };
      }
      // Allow API key access for server-side operations
      return true;
    },
    // Allow create via hooks/API
    create: () => true,
    // Only recipient can update (mark as read)
    update: ({ req }) => {
      if (req.user) {
        return {
          recipient: { equals: req.user.id },
        };
      }
      return true; // API key
    },
    // Only recipient can delete
    delete: ({ req }) => {
      if (req.user) {
        return {
          recipient: { equals: req.user.id },
        };
      }
      return true; // API key
    },
  },
  hooks: {
    // Basic validation - deduplication requires DB migration for dedupeKey column
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === "create") {
          // INVARIANT 1: Recipient is required
          if (!data?.recipient) {
            const error = new Error("Notification recipient is required");
            (error as any).status = 400;
            throw error;
          }

          // INVARIANT 2: Actor cannot be recipient (except for system notifications)
          if (
            data.type !== "system" &&
            data.actor &&
            String(data.actor) === String(data.recipient)
          ) {
            console.log(
              "[Notifications] Skipping self-notification:",
              data.type,
            );
            const error = new Error("Cannot notify yourself");
            (error as any).status = 400;
            throw error;
          }

          console.log("[Notifications] Creating:", {
            type: data.type,
            recipient: data.recipient,
          });
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: "recipient",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "actor",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Follow", value: "follow" },
        { label: "Like", value: "like" },
        { label: "Comment", value: "comment" },
        { label: "Mention", value: "mention" },
        { label: "Tag", value: "tag" },
        { label: "System", value: "system" },
      ],
      index: true,
    },
    {
      name: "entityType",
      type: "select",
      options: [
        { label: "Post", value: "post" },
        { label: "Comment", value: "comment" },
        { label: "Story", value: "story" },
        { label: "User", value: "user" },
        { label: "Message", value: "message" },
      ],
    },
    {
      name: "entityId",
      type: "text",
      index: true,
    },
    {
      name: "createdAt",
      type: "date",
      defaultValue: () => new Date(),
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "readAt",
      type: "date",
      index: true,
    },
    // NOTE: New fields below require DB migration before uncommenting
    // {
    //   name: "dedupeKey",
    //   type: "text",
    //   unique: true,
    //   index: true,
    // },
    // {
    //   name: "text",
    //   type: "text",
    //   maxLength: 200,
    // },
    // {
    //   name: "conversationId",
    //   type: "text",
    //   index: true,
    // },
    // {
    //   name: "pushStatus",
    //   type: "select",
    //   options: ["pending", "sent", "failed", "skipped"],
    //   defaultValue: "pending",
    // },
    // {
    //   name: "pushError",
    //   type: "text",
    // },
  ],
};

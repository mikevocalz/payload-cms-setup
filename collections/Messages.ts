import type { CollectionConfig } from "payload";

export const Messages: CollectionConfig = {
  slug: "messages",
  admin: {
    defaultColumns: ["sender", "conversation", "content", "createdAt"],
  },
  access: {
    // Allow read access - API route handles user-specific filtering
    // API key auth doesn't populate req.user, so we allow read and let API route filter
    read: () => true,
    // Allow create - API route validates sender
    create: () => true,
    // Allow update for own messages or via API key
    update: ({ req }) => {
      // API key auth (server-side) - allow, API route validates
      if (!req.user) return true;
      // JWT auth - only own messages
      return {
        sender: { equals: req.user.id },
      };
    },
    // Only allow delete for own messages
    delete: ({ req }) => {
      if (!req.user) return true;
      return {
        sender: { equals: req.user.id },
      };
    },
  },
  fields: [
    {
      name: "conversation",
      type: "relationship",
      relationTo: "conversations",
      required: true,
      index: true,
    },
    {
      name: "sender",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "content",
      type: "textarea",
      required: true,
      maxLength: 2000,
    },
    {
      name: "media",
      type: "array",
      maxRows: 4,
      admin: {
        description: "Media attachments (uploaded to CDN)",
      },
      fields: [
        {
          name: "type",
          type: "select",
          options: [
            { label: "Image", value: "image" },
            { label: "Video", value: "video" },
          ],
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
          admin: {
            description: "CDN URL of the media file",
          },
        },
      ],
    },
    {
      name: "mentions",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
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
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;
          // Update conversation's lastMessageAt
          await payload.update({
            collection: "conversations",
            id: doc.conversation,
            data: {
              lastMessageAt: new Date().toISOString(),
            },
          });
        }
        return doc;
      },
    ],
  },
};

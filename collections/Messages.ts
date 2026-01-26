import type { CollectionConfig } from "payload";

export const Messages: CollectionConfig = {
  slug: "messages",
  admin: {
    defaultColumns: ["sender", "conversation", "content", "createdAt"],
  },
  access: {
    // Allow read access when authenticated via API key or JWT
    // The API route handles user-specific filtering
    read: ({ req }) => {
      // If using API key authentication (req.user is set via API key), allow read
      // The API route will filter messages by conversation
      if (req.user) {
        return {
          "conversation.participants": {
            contains: req.user.id,
          },
        };
      }
      // Allow API key access for server-side operations
      return true;
    },
    create: () => true,
    update: ({ req }) => {
      if (req.user) {
        return {
          sender: { equals: req.user.id },
        };
      }
      return true;
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

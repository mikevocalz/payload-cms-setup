import type { CollectionConfig } from 'payload'

export const Conversations: CollectionConfig = {
  slug: "conversations",
  admin: {
    useAsTitle: "id",
  },
  access: {
    // Allow read - API route filters by participant
    read: () => true,
    // Allow create - API route validates participants
    create: () => true,
    // Allow update for participants only
    update: ({ req }) => {
      if (!req.user) return true; // API key auth
      return {
        participants: { contains: req.user.id },
      };
    },
    // Only allow delete for participants
    delete: ({ req }) => {
      if (!req.user) return true; // API key auth
      return {
        participants: { contains: req.user.id },
      };
    },
  },
  fields: [
    {
      name: "participants",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      required: true,
      index: true,
    },
    {
      name: "isGroup",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "groupName",
      type: "text",
      admin: {
        condition: (data) => data?.isGroup === true,
      },
    },
    {
      name: "lastMessageAt",
      type: "date",
      index: true,
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
}

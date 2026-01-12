import type { CollectionConfig } from 'payload'

export const Conversations: CollectionConfig = {
  slug: "conversations",
  admin: {
    useAsTitle: "id",
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

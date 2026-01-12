import type { CollectionConfig } from 'payload'

export const Blocks: CollectionConfig = {
  slug: "blocks",
  admin: {
    useAsTitle: "blocker",
  },
  fields: [
    {
      name: "blocker",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "blocked",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "reason",
      type: "text",
      maxLength: 500,
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
      fields: ["blocker", "blocked"],
      unique: true,
    },
  ],
}

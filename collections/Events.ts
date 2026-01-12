import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "type",
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      index: true,
    },
    {
      name: "type",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "metadata",
      type: "json",
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
  ],
}

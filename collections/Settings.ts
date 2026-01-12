import type { CollectionConfig } from 'payload'

export const Settings: CollectionConfig = {
  slug: "settings",
  admin: {
    useAsTitle: "key",
  },
  fields: [
    {
      name: "key",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "value",
      type: "json",
      required: true,
    },
    {
      name: "description",
      type: "text",
    },
    {
      name: "updatedAt",
      type: "date",
      defaultValue: () => new Date(),
    },
  ],
}

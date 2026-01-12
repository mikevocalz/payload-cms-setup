import type { CollectionConfig } from 'payload'

export const UserTags: CollectionConfig = {
  slug: "userTags",
  admin: {
    useAsTitle: "taggedUser",
  },
  fields: [
    {
      name: "taggedUser",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "taggedByUser",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "media",
      type: "relationship",
      relationTo: "media",
      required: true,
      index: true,
    },
    {
      name: "x",
      type: "number",
      min: 0,
      max: 100,
    },
    {
      name: "y",
      type: "number",
      min: 0,
      max: 100,
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

import type { CollectionConfig } from 'payload'

export const AIInteractions: CollectionConfig = {
  slug: "aiInteractions",
  admin: {
    useAsTitle: "user",
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "aiProfile",
      type: "relationship",
      relationTo: "aiProfiles",
      required: true,
    },
    {
      name: "input",
      type: "textarea",
      required: true,
    },
    {
      name: "output",
      type: "textarea",
      required: true,
    },
    {
      name: "tokensUsed",
      type: "number",
      defaultValue: 0,
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

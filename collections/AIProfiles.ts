import type { CollectionConfig } from 'payload'

export const AIProfiles: CollectionConfig = {
  slug: "aiProfiles",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "systemPrompt",
      type: "textarea",
      required: true,
    },
    {
      name: "voice",
      type: "select",
      options: [
        { label: "Default", value: "default" },
        { label: "Friendly", value: "friendly" },
        { label: "Professional", value: "professional" },
        { label: "Casual", value: "casual" },
      ],
      defaultValue: "default",
    },
    {
      name: "visibility",
      type: "select",
      options: [
        { label: "Public", value: "public" },
        { label: "Private", value: "private" },
      ],
      defaultValue: "private",
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

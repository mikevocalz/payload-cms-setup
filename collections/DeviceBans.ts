import type { CollectionConfig } from 'payload'

export const DeviceBans: CollectionConfig = {
  slug: "deviceBans",
  admin: {
    useAsTitle: "deviceFingerprint",
  },
  fields: [
    {
      name: "deviceFingerprint",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      index: true,
    },
    {
      name: "reason",
      type: "textarea",
      maxLength: 1000,
    },
    {
      name: "expiresAt",
      type: "date",
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

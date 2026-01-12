import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: "subscriptions",
  admin: {
    useAsTitle: "subscriber",
  },
  fields: [
    {
      name: "subscriber",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "creator",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "tier",
      type: "relationship",
      relationTo: "subscriptionTiers",
      required: true,
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Expired", value: "expired" },
        { label: "Paused", value: "paused" },
      ],
      defaultValue: "active",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "startedAt",
      type: "date",
      defaultValue: () => new Date(),
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
  indexes: [
    {
      fields: ["subscriber", "creator"],
      unique: true,
    },
  ],
}

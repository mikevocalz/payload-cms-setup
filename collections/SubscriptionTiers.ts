import type { CollectionConfig } from 'payload'

export const SubscriptionTiers: CollectionConfig = {
  slug: "subscriptionTiers",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "creator",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "price",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "currency",
      type: "select",
      options: [
        { label: "USD", value: "usd" },
        { label: "EUR", value: "eur" },
        { label: "GBP", value: "gbp" },
      ],
      defaultValue: "usd",
    },
    {
      name: "perks",
      type: "array",
      fields: [
        {
          name: "perk",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
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

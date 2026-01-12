import type { CollectionConfig } from 'payload'

export const Transactions: CollectionConfig = {
  slug: "transactions",
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
      name: "amount",
      type: "number",
      required: true,
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
      required: true,
    },
    {
      name: "provider",
      type: "select",
      options: [
        { label: "Stripe", value: "stripe" },
        { label: "PayPal", value: "paypal" },
        { label: "Apple Pay", value: "apple_pay" },
        { label: "Google Pay", value: "google_pay" },
      ],
      required: true,
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Completed", value: "completed" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
      ],
      defaultValue: "pending",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "externalId",
      type: "text",
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

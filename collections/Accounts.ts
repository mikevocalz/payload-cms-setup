import type { CollectionConfig } from "payload"

export const Accounts: CollectionConfig = {
  slug: "accounts",
  admin: {
    useAsTitle: "provider",
  },
  fields: [
    {
      name: "userId",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "accountId",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "provider",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "providerId",
      type: "text",
      required: true,
    },
    {
      name: "accessToken",
      type: "text",
    },
    {
      name: "refreshToken",
      type: "text",
    },
    {
      name: "expiresAt",
      type: "date",
    },
    {
      name: "scope",
      type: "text",
    },
  ],
}

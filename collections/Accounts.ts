import type { CollectionConfig } from "payload"

export const Accounts: CollectionConfig = {
  slug: "accounts",
  admin: {
    useAsTitle: "provider",
    description: "OAuth provider accounts linked to users",
  },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "Super-Admin" || req.user?.role === "Admin") return true
      return { userId: { equals: req.user?.id } }
    },
    update: ({ req }) => req.user?.role === "Super-Admin" || req.user?.role === "Admin",
    delete: ({ req }) => req.user?.role === "Super-Admin" || req.user?.role === "Admin",
    create: () => true,
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
      admin: {
        hidden: true,
      },
      access: {
        read: () => false,
      },
    },
    {
      name: "refreshToken",
      type: "text",
      admin: {
        hidden: true,
      },
      access: {
        read: () => false,
      },
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

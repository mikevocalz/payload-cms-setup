import type { CollectionConfig } from "payload"

export const Bookmarks: CollectionConfig = {
  slug: "bookmarks",
  admin: {
    defaultColumns: ["user", "post", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        user: {
          equals: user.id,
        },
      }
    },
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
      name: "post",
      type: "relationship",
      relationTo: "posts",
      required: true,
      index: true,
    },
  ],
  indexes: [
    {
      fields: ["user", "post"],
      unique: true,
    },
  ],
}

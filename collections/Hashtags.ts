import type { CollectionConfig } from "payload"

export const Hashtags: CollectionConfig = {
  slug: "hashtags",
  admin: {
    useAsTitle: "tag",
    defaultColumns: ["tag", "postsCount", "trending"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "tag",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "usageCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "blocked",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "trending",
      type: "checkbox",
      defaultValue: false,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "trendingScore",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
  ],
}

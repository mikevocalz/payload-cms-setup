import type { CollectionConfig } from "payload"

export const StoryViews: CollectionConfig = {
  slug: "story-views",
  admin: {
    defaultColumns: ["story", "user", "createdAt"],
  },
  fields: [
    {
      name: "story",
      type: "relationship",
      relationTo: "stories",
      required: true,
      index: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
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
  indexes: [
    {
      fields: ["story", "user"],
      unique: true,
    },
  ],
}

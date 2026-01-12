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
      name: "story_user_unique",
      fields: {
        story: 1,
        user: 1,
      },
      unique: true,
    },
  ],
}

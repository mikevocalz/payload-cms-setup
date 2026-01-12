import type { CollectionConfig } from 'payload'

export const Reactions: CollectionConfig = {
  slug: "reactions",
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
      name: "targetType",
      type: "select",
      options: [
        { label: "Post", value: "post" },
        { label: "Comment", value: "comment" },
        { label: "Story", value: "story" },
      ],
      required: true,
      index: true,
    },
    {
      name: "targetId",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "reaction",
      type: "select",
      options: [
        { label: "Like", value: "like" },
        { label: "Love", value: "love" },
        { label: "Laugh", value: "laugh" },
        { label: "Angry", value: "angry" },
        { label: "Sad", value: "sad" },
        { label: "Wow", value: "wow" },
      ],
      required: true,
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
      fields: ["user", "targetType", "targetId"],
      unique: true,
    },
  ],
}

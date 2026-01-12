import type { CollectionConfig } from 'payload'

export const ModerationActions: CollectionConfig = {
  slug: "moderationActions",
  admin: {
    useAsTitle: "moderator",
  },
  fields: [
    {
      name: "moderator",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "action",
      type: "select",
      options: [
        { label: "Warn", value: "warn" },
        { label: "Remove", value: "remove" },
        { label: "Suspend", value: "suspend" },
        { label: "Ban", value: "ban" },
      ],
      required: true,
    },
    {
      name: "targetType",
      type: "select",
      options: [
        { label: "User", value: "user" },
        { label: "Post", value: "post" },
        { label: "Comment", value: "comment" },
        { label: "Story", value: "story" },
        { label: "Message", value: "message" },
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
      name: "notes",
      type: "textarea",
      maxLength: 2000,
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

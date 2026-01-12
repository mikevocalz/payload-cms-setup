import type { CollectionConfig } from "payload"

export const Notifications: CollectionConfig = {
  slug: "notifications",
  admin: {
    defaultColumns: ["recipient", "type", "actor", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        recipient: {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: "recipient",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Follow", value: "follow" },
        { label: "Like", value: "like" },
        { label: "Comment", value: "comment" },
        { label: "Mention", value: "mention" },
        { label: "Tag", value: "tag" },
        { label: "System", value: "system" },
      ],
      index: true,
    },
    {
      name: "actor",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "entityType",
      type: "select",
      options: [
        { label: "Post", value: "post" },
        { label: "Comment", value: "comment" },
        { label: "Story", value: "story" },
        { label: "User", value: "user" },
        { label: "Message", value: "message" },
      ],
    },
    {
      name: "entityId",
      type: "text",
      index: true,
    },
    {
      name: "createdAt",
      type: "date",
      defaultValue: () => new Date(),
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "readAt",
      type: "date",
      index: true,
    },
  ],
}

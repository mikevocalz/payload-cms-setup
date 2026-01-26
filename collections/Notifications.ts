import type { CollectionConfig } from "payload"

export const Notifications: CollectionConfig = {
  slug: "notifications",
  admin: {
    defaultColumns: ["recipient", "type", "actor", "createdAt"],
  },
  access: {
    // Allow read access when authenticated via API key or JWT
    // The API route handles user-specific filtering
    read: ({ req }) => {
      // If user is authenticated, filter by recipient
      if (req.user) {
        return {
          recipient: {
            equals: req.user.id,
          },
        }
      }
      // Allow API key access for server-side operations
      return true
    },
    create: () => true,
    update: () => true,
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

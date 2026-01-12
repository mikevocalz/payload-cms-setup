import type { CollectionConfig } from "payload"

export const Messages: CollectionConfig = {
  slug: "messages",
  admin: {
    defaultColumns: ["sender", "conversation", "content", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        "conversation.participants": {
          contains: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: "conversation",
      type: "relationship",
      relationTo: "conversations",
      required: true,
      index: true,
    },
    {
      name: "sender",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "content",
      type: "textarea",
      required: true,
      maxLength: 2000,
    },
    {
      name: "media",
      type: "array",
      maxRows: 4,
      fields: [
        {
          name: "file",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
    {
      name: "mentions",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
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
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          const { payload } = req
          // Update conversation's lastMessageAt
          await payload.update({
            collection: "conversations",
            id: doc.conversation,
            data: {
              lastMessageAt: new Date(),
            },
          })
        }
        return doc
      },
    ],
  },
}

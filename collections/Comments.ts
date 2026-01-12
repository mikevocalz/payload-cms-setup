import type { CollectionConfig } from "payload"

export const Comments: CollectionConfig = {
  slug: "comments",
  admin: {
    useAsTitle: "content",
    defaultColumns: ["author", "post", "createdAt"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Enforce two-level depth rule: parentComment may only reference a top-level comment
        if (operation === "create" && data?.parentComment) {
          const { payload } = req
          const parentComment = await payload.findByID({
            collection: "comments",
            id: data.parentComment,
          })
          if (parentComment?.parentComment) {
            throw new Error("Comments can only be two levels deep. Cannot reply to a reply.")
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          const { payload } = req

          // Update post comments count
          const post = await payload.findByID({
            collection: "posts",
            id: doc.post,
          })
          await payload.update({
            collection: "posts",
            id: doc.post,
            data: {
              commentsCount: (post.commentsCount || 0) + 1,
            },
          })

          // Create notification for post author
          if (post.author !== doc.author) {
            await payload.create({
              collection: "notifications",
              data: {
                recipient: post.author,
                sender: doc.author,
                type: "comment",
                post: doc.post,
                comment: doc.id,
              },
            })
          }

          // If replying to a comment, notify parent comment author
          if (doc.parentComment) {
            const parentComment = await payload.findByID({
              collection: "comments",
              id: doc.parentComment,
            })
            if (parentComment.author !== doc.author) {
              await payload.create({
                collection: "notifications",
                data: {
                  recipient: parentComment.author,
                  sender: doc.author,
                  type: "reply",
                  post: doc.post,
                  comment: doc.id,
                },
              })
            }
          }
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const { payload } = req

        // Update post comments count
        const post = await payload.findByID({
          collection: "posts",
          id: doc.post,
        })
        await payload.update({
          collection: "posts",
          id: doc.post,
          data: {
            commentsCount: Math.max((post.commentsCount || 0) - 1, 0),
          },
        })
      },
    ],
  },
  fields: [
    {
      name: "author",
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
    {
      name: "content",
      type: "textarea",
      required: true,
      maxLength: 1000,
    },
    {
      name: "likesCount",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "parentComment",
      type: "relationship",
      relationTo: "comments",
    },
    {
      name: "createdAt",
      type: "date",
      defaultValue: () => new Date(),
      admin: {
        readOnly: true,
      },
    },
    {
      name: "moderationStatus",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      defaultValue: "approved",
      admin: {
        position: "sidebar",
      },
    },
  ],
}

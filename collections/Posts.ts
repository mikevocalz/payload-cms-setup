import type { CollectionConfig } from "payload"

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "content",
    defaultColumns: ["author", "content", "createdAt"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          // Update user's posts count
          const { payload } = req
          const author = await payload.findByID({
            collection: "users",
            id: doc.author,
          })
          await payload.update({
            collection: "users",
            id: doc.author,
            data: {
              postsCount: (author.postsCount || 0) + 1,
            },
          })

          // Parse and create hashtags
          const hashtagRegex = /#(\w+)/g
          const matches = doc.content.match(hashtagRegex)
          if (matches) {
            const uniqueTags = [...new Set(matches.map((tag: string) => tag.slice(1).toLowerCase()))]
            for (const tag of uniqueTags) {
              try {
                const existingTag = await payload.find({
                  collection: "hashtags",
                  where: { tag: { equals: tag } },
                  limit: 1,
                })
                if (existingTag.docs.length > 0) {
                  await payload.update({
                    collection: "hashtags",
                    id: existingTag.docs[0].id,
                    data: {
                      usageCount: (existingTag.docs[0].usageCount || 0) + 1,
                    },
                  })
                } else {
                  await payload.create({
                    collection: "hashtags",
                    data: { tag, usageCount: 1 },
                  })
                }
              } catch (error) {
                console.error("[v0] Error creating/updating hashtag:", error)
              }
            }
          }
        }
        return doc
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
      name: "content",
      type: "textarea",
      required: true,
      maxLength: 5000,
    },
    {
      name: "media",
      type: "array",
      maxRows: 4,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
      ],
    },
    {
      name: "likesCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "commentsCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "repostsCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "bookmarksCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "isRepost",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "originalPost",
      type: "relationship",
      relationTo: "posts",
      admin: {
        condition: (data) => data.isRepost,
      },
    },
    {
      name: "replyTo",
      type: "relationship",
      relationTo: "posts",
    },
    {
      name: "visibility",
      type: "select",
      defaultValue: "public",
      options: [
        { label: "Public", value: "public" },
        { label: "Followers Only", value: "followers" },
        { label: "Private", value: "private" },
      ],
    },
    {
      name: "hashtags",
      type: "relationship",
      relationTo: "hashtags",
      hasMany: true,
    },
    {
      name: "editedAt",
      type: "date",
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

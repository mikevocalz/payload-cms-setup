import type { CollectionConfig } from "payload";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "content",
    defaultColumns: ["author", "content", "createdAt"],
  },
  access: {
    read: () => true,
    create: () => true,
    // Only author can update their own posts (for caption editing)
    update: ({ req }) => {
      if (!req.user) return true; // API key auth
      return { author: { equals: req.user.id } };
    },
    // Only author can delete their own posts
    delete: ({ req }) => {
      if (!req.user) return true; // API key auth
      return { author: { equals: req.user.id } };
    },
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create" && doc.author) {
          // Update user's posts count
          try {
            const { payload } = req;
            const author = await payload.findByID({
              collection: "users",
              id: doc.author,
            });
            if (author) {
              await payload.update({
                collection: "users",
                id: doc.author,
                data: {
                  postsCount: (author.postsCount || 0) + 1,
                },
              });
            }
          } catch (e) {
            // Author might be external, skip count update
            console.log(
              "[Posts] Skipping post count update - author may be external",
            );
          }
        }

        // Parse and create hashtags
        if (operation === "create" && doc.content) {
          const { payload } = req;
          const hashtagRegex = /#(\w+)/g;
          const matches = doc.content.match(hashtagRegex);
          if (matches) {
            const uniqueTags = Array.from(
              new Set(matches.map((tag: string) => tag.slice(1).toLowerCase())),
            ) as string[];
            for (const tag of uniqueTags) {
              try {
                const existingTag = await payload.find({
                  collection: "hashtags",
                  where: { tag: { equals: tag } },
                  limit: 1,
                });
                if (existingTag.docs.length > 0) {
                  await payload.update({
                    collection: "hashtags",
                    id: existingTag.docs[0].id,
                    data: {
                      usageCount: (existingTag.docs[0].usageCount || 0) + 1,
                    },
                  });
                } else {
                  await payload.create({
                    collection: "hashtags",
                    data: { tag, usageCount: 1 },
                  });
                }
              } catch (error) {
                console.error("[v0] Error creating/updating hashtag:", error);
              }
            }
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: false,
      index: true,
    },
    {
      name: "externalAuthorId",
      type: "text",
      index: true,
      admin: {
        description: "External user ID from Better Auth",
      },
    },
    {
      name: "content",
      type: "textarea",
      required: false,
      maxLength: 5000,
    },
    {
      name: "location",
      type: "text",
      maxLength: 200,
    },
    {
      name: "media",
      type: "array",
      maxRows: 4,
      fields: [
        {
          name: "type",
          type: "select",
          options: [
            { label: "Image", value: "image" },
            { label: "Video", value: "video" },
          ],
        },
        {
          name: "url",
          type: "text",
          admin: {
            description: "External URL for media",
          },
        },
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
    {
      name: "isNsfw", // Fixed: was isNSFW which maps to is_n_s_f_w, but DB has is_nsfw
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Mark this post as Not Safe For Work (adult content)",
      },
    },
  ],
};

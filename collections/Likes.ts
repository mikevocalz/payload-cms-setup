import type { CollectionConfig } from "payload";

export const Likes: CollectionConfig = {
  slug: "likes",
  admin: {
    defaultColumns: ["user", "post", "createdAt"],
  },
  access: {
    read: () => true,
    create: () => true,
    delete: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;

          // Update post likes count
          if (doc.post) {
            const post = await payload.findByID({
              collection: "posts",
              id: doc.post,
            });
            await payload.update({
              collection: "posts",
              id: doc.post,
              data: {
                likesCount: (post.likesCount || 0) + 1,
              },
            });

            // Create notification for post author
            if (post.author !== doc.user) {
              await payload.create({
                collection: "notifications",
                data: {
                  recipient: post.author,
                  sender: doc.user,
                  type: "like",
                  post: doc.post,
                },
              });
            }
          }

          // Update comment likes count
          if (doc.comment) {
            const comment = await payload.findByID({
              collection: "comments",
              id: doc.comment,
            });
            await payload.update({
              collection: "comments",
              id: doc.comment,
              data: {
                likesCount: (comment.likesCount || 0) + 1,
              },
            });
          }
        }
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const { payload } = req;

        // Update post likes count
        if (doc.post) {
          const post = await payload.findByID({
            collection: "posts",
            id: doc.post,
          });
          await payload.update({
            collection: "posts",
            id: doc.post,
            data: {
              likesCount: Math.max((post.likesCount || 0) - 1, 0),
            },
          });
        }

        // Update comment likes count
        if (doc.comment) {
          const comment = await payload.findByID({
            collection: "comments",
            id: doc.comment,
          });
          await payload.update({
            collection: "comments",
            id: doc.comment,
            data: {
              likesCount: Math.max((comment.likesCount || 0) - 1, 0),
            },
          });
        }
      },
    ],
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
      name: "post",
      type: "relationship",
      relationTo: "posts",
      index: true,
    },
    {
      name: "comment",
      type: "relationship",
      relationTo: "comments",
      index: true,
    },
  ],
  indexes: [
    {
      fields: ["user", "post"],
      unique: true,
    },
  ],
};

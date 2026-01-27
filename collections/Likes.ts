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
    // CRITICAL: Prevent duplicate likes at application layer
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;

          // Check for existing like (user + post combination)
          if (data.post && data.user) {
            const existingLike = await payload.find({
              collection: "likes",
              where: {
                and: [
                  { user: { equals: data.user } },
                  { post: { equals: data.post } },
                ],
              },
              limit: 1,
            });

            if (existingLike.docs.length > 0) {
              console.log("[Likes] Duplicate like prevented:", {
                user: data.user,
                post: data.post,
              });
              throw new Error("User has already liked this post");
            }
          }

          // Check for existing like (user + comment combination)
          if (data.comment && data.user) {
            const existingLike = await payload.find({
              collection: "likes",
              where: {
                and: [
                  { user: { equals: data.user } },
                  { comment: { equals: data.comment } },
                ],
              },
              limit: 1,
            });

            if (existingLike.docs.length > 0) {
              console.log("[Likes] Duplicate comment like prevented:", {
                user: data.user,
                comment: data.comment,
              });
              throw new Error("User has already liked this comment");
            }
          }
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;

          // Update post likes count
          if (doc.post) {
            try {
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
              if (post.author && post.author !== doc.user) {
                await payload.create({
                  collection: "notifications",
                  data: {
                    recipient: post.author,
                    actor: doc.user,
                    type: "like",
                    post: doc.post,
                  },
                });
              }
            } catch (error) {
              console.error("[Likes] Error updating post likes count:", error);
              // Don't throw - allow like to succeed even if count update fails
            }
          }

          // Update comment likes count
          if (doc.comment) {
            try {
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
            } catch (error) {
              console.error(
                "[Likes] Error updating comment likes count:",
                error,
              );
            }
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
          try {
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
          } catch (error) {
            console.error(
              "[Likes] Error decrementing post likes count:",
              error,
            );
          }
        }

        // Update comment likes count
        if (doc.comment) {
          try {
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
          } catch (error) {
            console.error(
              "[Likes] Error decrementing comment likes count:",
              error,
            );
          }
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

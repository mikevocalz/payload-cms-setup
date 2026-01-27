import type { CollectionConfig } from "payload";

export const Bookmarks: CollectionConfig = {
  slug: "bookmarks",
  admin: {
    defaultColumns: ["user", "post", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      return {
        user: {
          equals: user.id,
        },
      };
    },
    create: () => true,
    delete: () => true,
  },
  hooks: {
    // INVARIANT: Prevent duplicate bookmarks (user + post)
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;

          if (data?.user && data?.post) {
            const existingBookmark = await payload.find({
              collection: "bookmarks",
              where: {
                and: [
                  { user: { equals: data.user } },
                  { post: { equals: data.post } },
                ],
              },
              limit: 1,
            });

            if (existingBookmark.docs.length > 0) {
              console.log(
                "[Bookmarks] INVARIANT: Duplicate bookmark prevented:",
                {
                  user: data.user,
                  post: data.post,
                },
              );
              // Return existing bookmark ID for idempotent behavior
              const error = new Error("User has already bookmarked this post");
              (error as any).status = 409;
              throw error;
            }
          }
        }
        return data;
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
      required: true,
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

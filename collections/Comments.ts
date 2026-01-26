/**
 * Payload CMS Comments Collection
 *
 * Comments on posts with support for nested replies
 *
 * @see https://payloadcms.com/docs/configuration/collections
 */

import type { CollectionConfig } from "payload";

export const Comments: CollectionConfig = {
  slug: "comments",
  admin: {
    useAsTitle: "content",
    defaultColumns: ["author", "post", "content", "createdAt"],
    group: "Engagement",
  },
  access: {
    read: () => true,
    // Allow creation via API key (server-side) or logged-in user
    create: () => true, // API key handles auth at server level
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Auto-set author to current user on create
        if (req.user && !data.author) {
          data.author = req.user.id;
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === "create") {
          // Update post's comment count on create (for post comments)
          if (doc.post) {
            try {
              const postId = typeof doc.post === "string" ? doc.post : doc.post.id;
              const post = await req.payload.findByID({
                collection: "posts",
                id: postId,
              });

              if (post) {
                await req.payload.update({
                  collection: "posts",
                  id: postId,
                  data: {
                    commentsCount: ((post.commentsCount as number) || 0) + 1,
                  },
                });
              }
            } catch (error) {
              console.error("[Comments] Error updating post comment count:", error);
            }
          }
          
          // Update story's comment count on create (for story comments)
          if (doc.story) {
            try {
              const storyId = typeof doc.story === "string" ? doc.story : doc.story.id;
              // Stories don't have commentsCount field, but we could add it
              // For now, just log that the comment was added
              console.log("[Comments] Story comment created for story:", storyId);
            } catch (error) {
              console.error("[Comments] Error processing story comment:", error);
            }
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    // Author relationship
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
      admin: {
        position: "sidebar",
      },
    },

    // Post relationship (for post comments)
    {
      name: "post",
      type: "relationship",
      relationTo: "posts",
      required: false, // Not required - can be story comment instead
      hasMany: false,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    
    // Story relationship (for story comments)
    {
      name: "story",
      type: "relationship",
      relationTo: "stories",
      required: false, // Not required - can be post comment instead
      hasMany: false,
      index: true,
      admin: {
        position: "sidebar",
        description: "Story this comment belongs to (if story comment)",
      },
    },

    // Comment content
    {
      name: "content",
      type: "textarea",
      required: true,
      maxLength: 1000,
      admin: {
        description: "Comment text (max 1000 characters)",
      },
    },

    // NOTE: Parent field removed temporarily due to DB migration issue
    // TODO: Add back after running migrations
    // {
    //   name: "parent",
    //   type: "relationship",
    //   relationTo: "comments",
    //   required: false,
    //   hasMany: false,
    //   admin: {
    //     position: "sidebar",
    //     description: "Parent comment (if this is a reply)",
    //   },
    // },

    // NOTE: Likes field removed temporarily due to DB migration issue
    // TODO: Add back after running migrations
    // {
    //   name: "likes",
    //   type: "number",
    //   defaultValue: 0,
    //   admin: {
    //     position: "sidebar",
    //     readOnly: true,
    //   },
    // },
  ],
  timestamps: true,
};

export default Comments;

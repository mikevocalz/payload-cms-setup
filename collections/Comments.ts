/**
 * Payload CMS Comments Collection
 *
 * Comments on posts only. Story replies use direct messaging (DMs).
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
      async ({ data, req, operation }) => {
        // Auto-set author to current user on create
        if (req.user && !data.author) {
          data.author = req.user.id;
        }

        // INVARIANT: Enforce 2-level comment depth (top-level + reply only)
        // If parent comment has a parent, reject (would be level 3+)
        if (operation === "create" && data?.parent) {
          const { payload } = req;
          const parentId =
            typeof data.parent === "object" ? data.parent.id : data.parent;

          try {
            const parentComment = await payload.findByID({
              collection: "comments",
              id: parentId,
              depth: 0,
            });

            if (parentComment && (parentComment as any).parent) {
              console.error("[Comments] INVARIANT: Reply-to-reply blocked:", {
                parentId,
                parentParentId: (parentComment as any).parent,
              });
              const error = new Error("Replies can only be 2 levels deep");
              (error as any).status = 409;
              throw error;
            }
          } catch (e: any) {
            // If it's our 409 error, rethrow it
            if (e.status === 409) throw e;
            // Otherwise log and continue (parent might not exist which is fine)
            console.warn(
              "[Comments] Could not verify parent depth:",
              e.message,
            );
          }
        }

        return data;
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === "create") {
          const { payload } = req;
          const postId =
            typeof doc.post === "string" ? doc.post : (doc.post as any)?.id;
          const authorId =
            typeof doc.author === "string"
              ? doc.author
              : (doc.author as any)?.id;

          // Update post's comment count on create (for post comments)
          if (postId) {
            try {
              const post = await payload.findByID({
                collection: "posts",
                id: postId,
                depth: 0,
              });

              if (post) {
                await payload.update({
                  collection: "posts",
                  id: postId,
                  data: {
                    commentsCount: ((post.commentsCount as number) || 0) + 1,
                  },
                });

                // Create notification for post author
                const postAuthorId =
                  typeof post.author === "object"
                    ? (post.author as any).id
                    : post.author;
                if (postAuthorId && String(postAuthorId) !== String(authorId)) {
                  try {
                    await payload.create({
                      collection: "notifications",
                      data: {
                        recipient: postAuthorId,
                        actor: authorId,
                        type: "comment",
                        entityType: "comment",
                        entityId: String(doc.id),
                      },
                    });
                  } catch (notifError: any) {
                    // 400 = self-notification prevented
                    if (notifError.status !== 400) {
                      console.error(
                        "[Comments] Error creating notification:",
                        notifError,
                      );
                    }
                  }
                }
              }
            } catch (error) {
              console.error(
                "[Comments] Error updating post comment count:",
                error,
              );
            }
          }

          // Handle reply notifications (use 'comment' type for replies too)
          if (doc.parent) {
            try {
              const parentId =
                typeof doc.parent === "string"
                  ? doc.parent
                  : (doc.parent as any)?.id;
              const parentComment = await payload.findByID({
                collection: "comments",
                id: parentId,
                depth: 0,
              });

              if (parentComment) {
                const parentAuthorId =
                  typeof parentComment.author === "object"
                    ? (parentComment.author as any).id
                    : parentComment.author;

                if (
                  parentAuthorId &&
                  String(parentAuthorId) !== String(authorId)
                ) {
                  try {
                    await payload.create({
                      collection: "notifications",
                      data: {
                        recipient: parentAuthorId,
                        actor: authorId,
                        type: "comment",
                        entityType: "comment",
                        entityId: String(doc.id),
                      },
                    });
                  } catch (notifError: any) {
                    if (notifError.status !== 400) {
                      console.error(
                        "[Comments] Error creating reply notification:",
                        notifError,
                      );
                    }
                  }
                }
              }
            } catch (error) {
              console.error(
                "[Comments] Error creating reply notification:",
                error,
              );
            }
          }

          // Note: Story replies use direct messaging (DMs), not comments
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

    // Post relationship
    {
      name: "post",
      type: "relationship",
      relationTo: "posts",
      required: true,
      hasMany: false,
      index: true,
      admin: {
        position: "sidebar",
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

    // Parent comment relationship - enables threading (2 levels max enforced in beforeChange)
    // NOTE: Requires parent_id column in DB (added via migration)
    {
      name: "parent",
      type: "relationship",
      relationTo: "comments",
      required: false,
      hasMany: false,
      index: true,
      admin: {
        position: "sidebar",
        description: "Parent comment (if this is a reply - max 2 levels)",
      },
    },

    // Likes count - updated by Likes collection hooks
    {
      name: "likesCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },

    // Client mutation ID for idempotency - prevents duplicate comments from retries
    // NOTE: Requires client_mutation_id column in DB (added via migration)
    {
      name: "clientMutationId",
      type: "text",
      required: false,
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Client-generated ID for idempotency (prevents duplicates)",
        readOnly: true,
      },
    },
  ],
  timestamps: true,
};

export default Comments;

import type { CollectionConfig } from "payload";

export const Follows: CollectionConfig = {
  slug: "follows",
  admin: {
    defaultColumns: ["follower", "following", "createdAt"],
  },
  access: {
    read: () => true,
    create: () => true,
    delete: () => true,
  },
  hooks: {
    // INVARIANT: Prevent duplicate follows AND self-follow
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;

          // INVARIANT 1: Prevent self-follow
          if (data?.follower && data?.following) {
            const followerId =
              typeof data.follower === "object"
                ? data.follower.id
                : data.follower;
            const followingId =
              typeof data.following === "object"
                ? data.following.id
                : data.following;

            if (String(followerId) === String(followingId)) {
              console.log("[Follows] INVARIANT: Self-follow prevented:", {
                user: followerId,
              });
              const error = new Error("Cannot follow yourself");
              (error as any).status = 409;
              throw error;
            }

            // INVARIANT 2: Prevent duplicate follows
            const existingFollow = await payload.find({
              collection: "follows",
              where: {
                and: [
                  { follower: { equals: followerId } },
                  { following: { equals: followingId } },
                ],
              },
              limit: 1,
            });

            if (existingFollow.docs.length > 0) {
              console.log("[Follows] INVARIANT: Duplicate follow prevented:", {
                follower: followerId,
                following: followingId,
              });
              const error = new Error("Already following this user");
              (error as any).status = 409;
              throw error;
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

          try {
            // Update follower's following count
            const followerUser = await payload.findByID({
              collection: "users",
              id: doc.follower,
            });
            await payload.update({
              collection: "users",
              id: doc.follower,
              data: {
                followingCount: (followerUser.followingCount || 0) + 1,
              },
            });

            // Update following's followers count
            const followingUser = await payload.findByID({
              collection: "users",
              id: doc.following,
            });
            await payload.update({
              collection: "users",
              id: doc.following,
              data: {
                followersCount: (followingUser.followersCount || 0) + 1,
              },
            });

            // Create notification
            try {
              await payload.create({
                collection: "notifications",
                data: {
                  recipient: doc.following,
                  actor: doc.follower,
                  type: "follow",
                  entityType: "user",
                  entityId: String(doc.follower),
                },
              });
            } catch (notifError: any) {
              // 400 = self-notification prevented, which is fine
              if (notifError.status !== 400) {
                console.error(
                  "[Follows] Error creating notification:",
                  notifError,
                );
              }
            }
          } catch (error) {
            console.error("[Follows] Error in afterChange hook:", error);
            // Don't throw - allow follow to succeed even if count update fails
          }
        }
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const { payload } = req;

        try {
          // Update follower's following count
          const followerUser = await payload.findByID({
            collection: "users",
            id: doc.follower,
          });
          await payload.update({
            collection: "users",
            id: doc.follower,
            data: {
              followingCount: Math.max(
                (followerUser.followingCount || 0) - 1,
                0,
              ),
            },
          });

          // Update following's followers count
          const followingUser = await payload.findByID({
            collection: "users",
            id: doc.following,
          });
          await payload.update({
            collection: "users",
            id: doc.following,
            data: {
              followersCount: Math.max(
                (followingUser.followersCount || 0) - 1,
                0,
              ),
            },
          });
        } catch (error) {
          console.error("[Follows] Error in afterDelete hook:", error);
        }
      },
    ],
  },
  fields: [
    {
      name: "follower",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "following",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
  ],
  indexes: [
    {
      fields: ["follower", "following"],
      unique: true,
    },
  ],
};

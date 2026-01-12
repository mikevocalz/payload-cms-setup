import type { CollectionConfig } from "payload"

export const Follows: CollectionConfig = {
  slug: "follows",
  admin: {
    defaultColumns: ["follower", "following", "createdAt"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          const { payload } = req

          // Update follower's following count
          const followerUser = await payload.findByID({
            collection: "users",
            id: doc.follower,
          })
          await payload.update({
            collection: "users",
            id: doc.follower,
            data: {
              followingCount: (followerUser.followingCount || 0) + 1,
            },
          })

          // Update following's followers count
          const followingUser = await payload.findByID({
            collection: "users",
            id: doc.following,
          })
          await payload.update({
            collection: "users",
            id: doc.following,
            data: {
              followersCount: (followingUser.followersCount || 0) + 1,
            },
          })

          // Create notification
          await payload.create({
            collection: "notifications",
            data: {
              recipient: doc.following,
              sender: doc.follower,
              type: "follow",
            },
          })
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const { payload } = req

        // Update follower's following count
        const followerUser = await payload.findByID({
          collection: "users",
          id: doc.follower,
        })
        await payload.update({
          collection: "users",
          id: doc.follower,
          data: {
            followingCount: Math.max((followerUser.followingCount || 0) - 1, 0),
          },
        })

        // Update following's followers count
        const followingUser = await payload.findByID({
          collection: "users",
          id: doc.following,
        })
        await payload.update({
          collection: "users",
          id: doc.following,
          data: {
            followersCount: Math.max((followingUser.followersCount || 0) - 1, 0),
          },
        })
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
      name: "follower_following_unique",
      fields: {
        follower: 1,
        following: 1,
      },
      unique: true,
    },
  ],
}

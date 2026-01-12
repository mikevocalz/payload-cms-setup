import type { CollectionConfig } from 'payload'

export const Profiles: CollectionConfig = {
  slug: "profiles",
  admin: {
    useAsTitle: "user",
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "links",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "followerCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "followingCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "postCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
  ],
}

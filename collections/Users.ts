import type { CollectionConfig } from "payload"

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    depth: 2,
  },
  fields: [
    {
      name: "username",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "displayName",
      type: "text",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "bio",
      type: "textarea",
      maxLength: 500,
    },
    {
      name: "pronouns",
      type: "text",
      maxLength: 50,
    },
    {
      name: "location",
      type: "text",
      maxLength: 100,
    },
    {
      name: "roles",
      type: "select",
      options: [
        { label: "User", value: "user" },
        { label: "Creator", value: "creator" },
        { label: "Moderator", value: "moderator" },
        { label: "Admin", value: "admin" },
      ],
      defaultValue: "user",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "verified",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "bannedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "lastActiveAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "followersCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "followingCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "postsCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
  ],
}

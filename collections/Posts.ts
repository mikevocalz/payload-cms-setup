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
    // Self-referencing relationships removed for debugging
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
      name: "isNSFW",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Mark this post as Not Safe For Work (adult content)",
      },
    },
  ],
};

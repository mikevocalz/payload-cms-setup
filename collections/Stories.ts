import type { CollectionConfig } from "payload";

export const Stories: CollectionConfig = {
  slug: "stories",
  admin: {
    useAsTitle: "author",
    defaultColumns: ["author", "createdAt", "visibility", "moderationStatus"],
    group: "Content",
  },
  access: {
    read: () => true,
    create: () => true,
    update: ({ req }) => {
      // API key auth (no req.user) can update any story
      if (!req.user) return true;
      // Users can only update their own stories
      return { author: { equals: req.user.id } };
    },
    delete: ({ req }) => {
      // API key auth can delete any story
      if (!req.user) return true;
      // Users can only delete their own stories
      return { author: { equals: req.user.id } };
    },
  },
  fields: [
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true, // Author is required
      index: true,
      admin: {
        position: "sidebar",
        description: "The user who created this story",
      },
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
      name: "media",
      type: "upload",
      relationTo: "media",
      required: false,
    },
    {
      name: "items",
      type: "array",
      fields: [
        {
          name: "type",
          type: "select",
          options: [
            { label: "Image", value: "image" },
            { label: "Video", value: "video" },
          ],
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
      name: "viewed",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "caption",
      type: "text",
      maxLength: 500,
    },
    {
      name: "location",
      type: "text",
      maxLength: 200,
    },
    {
      name: "stickers",
      type: "array",
      fields: [
        {
          name: "type",
          type: "text",
          required: true,
        },
        {
          name: "data",
          type: "json",
        },
      ],
    },
    {
      name: "visibility",
      type: "select",
      options: [
        { label: "Public", value: "public" },
        { label: "Followers", value: "followers" },
        { label: "Private", value: "private" },
      ],
      defaultValue: "public",
      required: true,
    },
    {
      name: "expiresAt",
      type: "date",
      required: true,
      defaultValue: () => {
        const date = new Date();
        date.setHours(date.getHours() + 24); // 24 hours from now
        return date;
      },
    },
    {
      name: "createdAt",
      type: "date",
      defaultValue: () => new Date(),
      admin: {
        readOnly: true,
      },
    },
    {
      name: "viewCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "moderationStatus",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      defaultValue: "pending",
      admin: {
        position: "sidebar",
      },
    },
  ],
};

import type { CollectionConfig } from "payload";

export const Stories: CollectionConfig = {
  slug: "stories",
  admin: {
    useAsTitle: "author",
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
      required: true,
      index: true,
    },
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      required: true,
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

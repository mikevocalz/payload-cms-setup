import type { CollectionConfig } from "payload"

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user, // Allow authenticated users to upload
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  upload: {
    // Store files in database for Vercel compatibility
    // No staticDir - files stored as base64 in DB
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*", "video/*", "audio/*"],
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        height: 1024,
        position: "centre",
      },
      {
        name: "tablet",
        width: 1024,
        height: undefined,
        position: "centre",
      },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
    },
    {
      name: "type",
      type: "select",
      options: [
        { label: "Image", value: "image" },
        { label: "Video", value: "video" },
        { label: "Audio", value: "audio" },
      ],
      defaultValue: "image",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      index: true,
    },
    {
      name: "blurhash",
      type: "text",
    },
    {
      name: "nsfwScore",
      type: "number",
      min: 0,
      max: 1,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "aiTags",
      type: "array",
      fields: [
        {
          name: "tag",
          type: "text",
        },
        {
          name: "confidence",
          type: "number",
          min: 0,
          max: 1,
        },
      ],
    },
    {
      name: "createdAt",
      type: "date",
      defaultValue: () => new Date(),
      admin: {
        readOnly: true,
      },
    },
  ],
}

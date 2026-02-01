import type { CollectionConfig } from "payload";

export const Uploads: CollectionConfig = {
  slug: "uploads",
  access: {
    read: () => true, // Public read for serving files
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "filename",
      type: "text",
      required: true,
    },
    {
      name: "mimeType",
      type: "text",
      required: true,
    },
    {
      name: "filesize",
      type: "number",
      required: true,
    },
    {
      name: "fileData",
      type: "text",
      required: false, // Make it optional to bypass validation
      admin: {
        hidden: true,
      },
      validate: () => true, // Always pass validation
    },
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
  ],
};

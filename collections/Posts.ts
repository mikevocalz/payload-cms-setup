import type { CollectionConfig } from "payload";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "content",
  },
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    {
      name: "content",
      type: "textarea",
      required: false,
    },
    {
      name: "location",
      type: "text",
    },
  ],
};

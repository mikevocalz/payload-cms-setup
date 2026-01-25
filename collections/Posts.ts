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
    {
      name: "likesCount",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "isNsfw",  // Changed from isNSFW to isNsfw → maps to is_nsfw
      type: "checkbox",
      defaultValue: false,
    },
  ],
};

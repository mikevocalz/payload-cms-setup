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
    },
    {
      name: "isNSFW",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};

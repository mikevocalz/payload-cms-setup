import type { CollectionConfig } from "payload";

export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "title",
  },
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    {
      name: "host",
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
      name: "title",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "date",
      type: "date",
      required: false,
      index: true,
      admin: {
        description: "Event date (alternative to startDate for mobile app)",
      },
    },
    {
      name: "startDate",
      type: "date",
      required: false,
      index: true,
    },
    {
      name: "endDate",
      type: "date",
      index: true,
    },
    {
      name: "time",
      type: "text",
      admin: {
        description: "Human-readable time string (e.g., '7:00 PM')",
      },
    },
    {
      name: "location",
      type: "text",
      maxLength: 200,
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "image",
      type: "text",
      admin: {
        description: "External image URL for mobile app",
      },
    },
    {
      name: "price",
      type: "number",
      min: 0,
    },
    {
      name: "category",
      type: "select",
      options: [
        { label: "Music", value: "music" },
        { label: "Sports", value: "sports" },
        { label: "Art", value: "art" },
        { label: "Food", value: "food" },
        { label: "Tech", value: "tech" },
        { label: "Business", value: "business" },
        { label: "Health", value: "health" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "likes",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "totalAttendees",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "isOnline",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "maxAttendees",
      type: "number",
      min: 1,
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
};

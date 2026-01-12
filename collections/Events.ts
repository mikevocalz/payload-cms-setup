import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "host",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
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
      name: "startDate",
      type: "date",
      required: true,
      index: true,
    },
    {
      name: "endDate",
      type: "date",
      index: true,
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
}

import type { CollectionConfig } from "payload";

export const EventRsvps: CollectionConfig = {
  slug: "event-rsvps",
  admin: {
    defaultColumns: ["event", "user", "status", "createdAt"],
  },
  fields: [
    {
      name: "event",
      type: "relationship",
      relationTo: "events",
      required: true,
      index: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "interested",
      options: [
        { label: "Going", value: "going" },
        { label: "Interested", value: "interested" },
        { label: "Not Going", value: "not_going" },
      ],
    },
    {
      name: "ticketToken",
      type: "text",
      admin: {
        description: "Unique QR code token for ticket verification",
        readOnly: true,
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
  ],
  indexes: [
    {
      fields: ["event", "user"],
      unique: true,
    },
  ],
};

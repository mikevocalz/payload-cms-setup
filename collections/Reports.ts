import type { CollectionConfig } from 'payload'

export const Reports: CollectionConfig = {
  slug: "reports",
  admin: {
    useAsTitle: "reporter",
  },
  fields: [
    {
      name: "reporter",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "targetType",
      type: "select",
      options: [
        { label: "User", value: "user" },
        { label: "Post", value: "post" },
        { label: "Comment", value: "comment" },
        { label: "Story", value: "story" },
        { label: "Message", value: "message" },
      ],
      required: true,
      index: true,
    },
    {
      name: "targetId",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "reason",
      type: "select",
      options: [
        { label: "Spam", value: "spam" },
        { label: "Harassment", value: "harassment" },
        { label: "Hate Speech", value: "hate_speech" },
        { label: "Violence", value: "violence" },
        { label: "Nudity", value: "nudity" },
        { label: "Misinformation", value: "misinformation" },
        { label: "Copyright", value: "copyright" },
        { label: "Other", value: "other" },
      ],
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      maxLength: 1000,
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Under Review", value: "under_review" },
        { label: "Resolved", value: "resolved" },
        { label: "Dismissed", value: "dismissed" },
      ],
      defaultValue: "pending",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "reviewedBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
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
}

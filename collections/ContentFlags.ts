import type { CollectionConfig } from 'payload'

export const ContentFlags: CollectionConfig = {
  slug: "contentFlags",
  admin: {
    useAsTitle: "contentType",
  },
  fields: [
    {
      name: "contentType",
      type: "select",
      options: [
        { label: "Post", value: "post" },
        { label: "Comment", value: "comment" },
        { label: "Story", value: "story" },
        { label: "Message", value: "message" },
        { label: "Media", value: "media" },
      ],
      required: true,
      index: true,
    },
    {
      name: "contentId",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "flagType",
      type: "select",
      options: [
        { label: "NSFW", value: "nsfw" },
        { label: "Violence", value: "violence" },
        { label: "Hate Speech", value: "hate_speech" },
        { label: "Spam", value: "spam" },
        { label: "Misinformation", value: "misinformation" },
      ],
      required: true,
    },
    {
      name: "confidence",
      type: "number",
      min: 0,
      max: 1,
    },
    {
      name: "source",
      type: "select",
      options: [
        { label: "AI", value: "ai" },
        { label: "User", value: "user" },
        { label: "Moderator", value: "mod" },
      ],
      required: true,
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

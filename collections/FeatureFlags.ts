import type { CollectionConfig } from 'payload'

export const FeatureFlags: CollectionConfig = {
  slug: "featureFlags",
  admin: {
    useAsTitle: "flag",
  },
  fields: [
    {
      name: "flag",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "enabled",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "rolloutPercentage",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 0,
    },
    {
      name: "description",
      type: "text",
    },
    {
      name: "updatedAt",
      type: "date",
      defaultValue: () => new Date(),
    },
  ],
}

import type { CollectionConfig } from 'payload'

export const LegalPages: CollectionConfig = {
  slug: 'legal-pages',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'lastUpdated'],
  },
  fields: [
    {
      name: 'slug',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: 'About / Community Focus', value: 'about' },
        { label: 'Privacy Policy', value: 'privacy-policy' },
        { label: 'Terms of Service', value: 'terms-of-service' },
        { label: 'Community Standards', value: 'community-standards' },
        { label: 'FAQ', value: 'faq' },
        { label: 'Eligibility Criteria', value: 'eligibility' },
        { label: 'Identity Protection', value: 'identity-protection' },
        { label: 'Advertising Policy', value: 'ad-policy' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'subtitle',
      type: 'text',
    },
    {
      name: 'effectiveDate',
      type: 'text',
      admin: { description: 'e.g., "January 2026"' },
    },
    {
      name: 'lastUpdated',
      type: 'text',
      admin: { description: 'e.g., "January 2026"' },
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Markdown supported. Use ## for headings, • for lists.',
      },
    },
    {
      name: 'faqs',
      type: 'array',
      admin: {
        description: 'Only for FAQ page',
        condition: (data) => data.slug === 'faq',
      },
      fields: [
        {
          name: 'category',
          type: 'text',
          admin: { description: 'e.g., General, Verification, Privacy' },
        },
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'answer',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
}

import type { Field } from 'payload'
import { formatSlug } from '@/utilities/formatSlug'

type Slug = (fieldToUse?: string, overrides?: Partial<Field>) => Field

export const slugField: Slug = (fieldToUse = 'title', overrides = {}) => {
  return {
    name: 'slug',
    type: 'text',
    admin: {
      position: 'sidebar',
    },
    hooks: {
      beforeValidate: [formatSlug(fieldToUse)],
    },
    index: true,
    label: 'Slug',
    ...overrides,
  } as Field
}

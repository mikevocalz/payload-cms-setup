import type { CollectionConfig } from 'payload'
import { hero } from '@/heros/config'
import { slugField } from '@/fields/slug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [hero],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [
                // Import block configs
                {
                  slug: 'archive',
                  interfaceName: 'ArchiveBlock',
                  fields: [
                    {
                      name: 'introContent',
                      type: 'richText',
                      label: 'Intro Content',
                    },
                    {
                      name: 'populateBy',
                      type: 'select',
                      defaultValue: 'collection',
                      options: [
                        { label: 'Collection', value: 'collection' },
                        { label: 'Individual Selection', value: 'selection' },
                      ],
                    },
                    {
                      name: 'relationTo',
                      type: 'select',
                      admin: {
                        condition: (_, siblingData) => siblingData.populateBy === 'collection',
                      },
                      defaultValue: 'posts',
                      label: 'Collections To Show',
                      options: [{ label: 'Posts', value: 'posts' }],
                    },
                    {
                      name: 'limit',
                      type: 'number',
                      admin: {
                        condition: (_, siblingData) => siblingData.populateBy === 'collection',
                        step: 1,
                      },
                      defaultValue: 10,
                      label: 'Limit',
                    },
                    {
                      name: 'selectedDocs',
                      type: 'relationship',
                      admin: {
                        condition: (_, siblingData) => siblingData.populateBy === 'selection',
                      },
                      hasMany: true,
                      label: 'Selection',
                      relationTo: ['posts'],
                    },
                  ],
                  labels: { plural: 'Archives', singular: 'Archive' },
                },
                {
                  slug: 'content',
                  interfaceName: 'ContentBlock',
                  fields: [
                    {
                      name: 'columns',
                      type: 'array',
                      fields: [
                        {
                          name: 'size',
                          type: 'select',
                          defaultValue: 'oneThird',
                          options: [
                            { label: 'One Third', value: 'oneThird' },
                            { label: 'Half', value: 'half' },
                            { label: 'Two Thirds', value: 'twoThirds' },
                            { label: 'Full', value: 'full' },
                          ],
                        },
                        { name: 'richText', type: 'richText' },
                        { name: 'enableLink', type: 'checkbox' },
                        {
                          name: 'link',
                          type: 'group',
                          admin: {
                            condition: (_, { enableLink }) => Boolean(enableLink),
                          },
                          fields: [
                            {
                              name: 'type',
                              type: 'radio',
                              defaultValue: 'reference',
                              options: [
                                { label: 'Internal Link', value: 'reference' },
                                { label: 'Custom URL', value: 'custom' },
                              ],
                            },
                            {
                              name: 'url',
                              type: 'text',
                              admin: {
                                condition: (_, siblingData) => siblingData?.type === 'custom',
                              },
                              label: 'Custom URL',
                            },
                            { name: 'label', type: 'text', label: 'Label' },
                            { name: 'newTab', type: 'checkbox', label: 'Open in new tab' },
                          ],
                        },
                      ],
                    },
                  ],
                  labels: { plural: 'Content Blocks', singular: 'Content' },
                },
                {
                  slug: 'cta',
                  interfaceName: 'CallToActionBlock',
                  fields: [
                    { name: 'richText', type: 'richText', label: 'Content' },
                    {
                      name: 'links',
                      type: 'array',
                      maxRows: 2,
                      fields: [
                        {
                          name: 'link',
                          type: 'group',
                          fields: [
                            {
                              name: 'type',
                              type: 'radio',
                              defaultValue: 'reference',
                              options: [
                                { label: 'Internal Link', value: 'reference' },
                                { label: 'Custom URL', value: 'custom' },
                              ],
                            },
                            {
                              name: 'url',
                              type: 'text',
                              admin: {
                                condition: (_, siblingData) => siblingData?.type === 'custom',
                              },
                            },
                            { name: 'label', type: 'text', required: true },
                            {
                              name: 'appearance',
                              type: 'select',
                              defaultValue: 'default',
                              options: [
                                { label: 'Default', value: 'default' },
                                { label: 'Outline', value: 'outline' },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  labels: { plural: 'Calls to Action', singular: 'Call to Action' },
                },
                {
                  slug: 'mediaBlock',
                  interfaceName: 'MediaBlock',
                  fields: [
                    { name: 'media', type: 'upload', relationTo: 'media', required: true },
                    { name: 'caption', type: 'richText' },
                  ],
                  labels: { plural: 'Media Blocks', singular: 'Media Block' },
                },
              ],
            },
          ],
        },
      ],
    },
    slugField(),
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
    maxPerDoc: 50,
  },
}

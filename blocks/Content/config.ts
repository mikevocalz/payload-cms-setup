import type { Block } from 'payload'
import { linkGroup } from '../../fields/linkGroup'

export const ContentBlock: Block = {
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
            {
              label: 'One Third',
              value: 'oneThird',
            },
            {
              label: 'Half',
              value: 'half',
            },
            {
              label: 'Two Thirds',
              value: 'twoThirds',
            },
            {
              label: 'Full',
              value: 'full',
            },
          ],
        },
        {
          name: 'richText',
          type: 'richText',
        },
        {
          name: 'enableLink',
          type: 'checkbox',
        },
        linkGroup({
          appearances: ['default', 'outline'],
          overrides: {
            admin: {
              condition: (_: any, { enableLink }: { enableLink?: boolean }) => Boolean(enableLink),
            },
          },
        }),
      ],
    },
  ],
  labels: {
    plural: 'Content Blocks',
    singular: 'Content',
  },
}

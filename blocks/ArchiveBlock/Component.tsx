'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import RichText from '@/components/RichText'
import { CollectionArchive } from '@/components/CollectionArchive'

import type { ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
  }
> = (props) => {
  const { id, categories, introContent, limit, populateBy, selectedDocs } = props

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ml-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive
        categories={categories}
        limit={limit ?? 10}
        populateBy={populateBy}
        selectedDocs={selectedDocs}
      />
    </div>
  )
}

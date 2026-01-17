import React from 'react'
import RichText from '@/components/RichText'
import { Card } from '@/components/Card'

import type { RelatedPostsBlock as RelatedPostsBlockProps, Post } from '@/payload-types'

export const RelatedPostsBlock: React.FC<RelatedPostsBlockProps> = (props) => {
  const { docs, introContent } = props

  return (
    <div className="container my-16">
      {introContent && (
        <RichText className="mb-8" data={introContent} enableGutter={false} />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {docs?.map((doc, index) => {
          if (typeof doc === 'object' && doc !== null) {
            return <Card key={index} doc={doc as Post} relationTo="posts" />
          }
          return null
        })}
      </div>
    </div>
  )
}

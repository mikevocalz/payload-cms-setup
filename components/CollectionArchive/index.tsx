'use client'

import React from 'react'
import { Card } from '@/components/Card'

export type Props = {
  categories?: any[]
  limit?: number
  populateBy?: 'collection' | 'selection'
  selectedDocs?: any[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { categories, limit = 10, populateBy, selectedDocs } = props

  // This component would normally fetch posts based on populateBy
  // For now, it renders selectedDocs if available
  const docs = selectedDocs || []

  return (
    <div className="container">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {docs.slice(0, limit).map((doc, index) => {
          if (typeof doc === 'object' && doc !== null) {
            return <Card key={index} doc={doc} relationTo="posts" showCategories />
          }
          return null
        })}
      </div>
    </div>
  )
}

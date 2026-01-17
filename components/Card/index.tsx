'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: any
  relationTo?: 'posts' | 'pages'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, heroImage, title } = doc || {}
  const titleToUse = titleFromProps || title
  const href = `/${relationTo}/${slug}`

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0

  return (
    <article
      className={cn(
        'border border-border rounded-lg overflow-hidden bg-card hover:cursor-pointer',
        className,
      )}
    >
      <Link className="relative w-full" href={href}>
        {heroImage && typeof heroImage !== 'string' && (
          <Media
            className="relative w-full aspect-[16/9]"
            imgClassName="object-cover"
            resource={heroImage}
          />
        )}
        <div className="p-4">
          {showCategories && hasCategories && (
            <div className="uppercase text-sm mb-4">
              {categories?.map((category: any, index: number) => {
                if (typeof category === 'object') {
                  const { title: categoryTitle } = category
                  const isLast = index === categories.length - 1
                  return (
                    <span className="text-muted-foreground" key={index}>
                      {categoryTitle}
                      {!isLast && <>, &nbsp;</>}
                    </span>
                  )
                }
                return null
              })}
            </div>
          )}
          {titleToUse && (
            <h3 className="text-lg font-semibold">{titleToUse}</h3>
          )}
        </div>
      </Link>
    </article>
  )
}

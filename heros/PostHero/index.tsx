'use client'

import React from 'react'
import { formatDateTime } from '../../utilities/formatDateTime'
import { Media } from '@/components/Media'

import type { Post } from '@/payload-types'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, heroImage, publishedAt, title } = post

  return (
    <div className="relative -mt-[10.4rem] flex items-end" data-theme="dark">
      <div className="container z-10 relative text-white pb-8">
        <div className="max-w-[34rem]">
          <div className="uppercase text-sm mb-6">
            {categories?.map((category, index) => {
              if (typeof category === 'object' && category !== null) {
                const { title: categoryTitle } = category
                const titleToUse = categoryTitle || 'Untitled category'
                const isLast = index === categories.length - 1
                return (
                  <span key={index}>
                    {titleToUse}
                    {!isLast && <>, &nbsp;</>}
                  </span>
                )
              }
              return null
            })}
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl mb-6">{title}</h1>
          {publishedAt && (
            <div className="flex flex-col gap-4 md:flex-row md:gap-16">
              <div className="flex flex-col gap-1">
                <p className="text-sm">Date Published</p>
                <time dateTime={publishedAt}>{formatDateTime(publishedAt)}</time>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="min-h-[80vh] select-none">
        {heroImage && typeof heroImage !== 'string' && (
          <>
            <Media fill imgClassName="-z-10 object-cover" priority resource={heroImage} />
            <div className="absolute pointer-events-none left-0 bottom-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
          </>
        )}
      </div>
    </div>
  )
}

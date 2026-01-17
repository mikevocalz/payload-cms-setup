'use client'

import { cn } from '@/lib/utils'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '.'

export const ImageMedia: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    imgClassName,
    priority,
    resource,
    src: srcFromProps,
  } = props

  let width: number | undefined
  let height: number | undefined
  let alt = altFromProps
  let src = srcFromProps || ''

  if (resource && typeof resource === 'object') {
    const {
      alt: altFromResource,
      filename,
      height: heightFromResource,
      url,
      width: widthFromResource,
    } = resource

    alt = altFromResource || ''
    width = widthFromResource || undefined
    height = heightFromResource || undefined
    src = url || ''
  }

  return (
    <NextImage
      alt={alt || ''}
      className={cn(imgClassName)}
      fill={fill}
      height={!fill ? height : undefined}
      priority={priority}
      src={src}
      width={!fill ? width : undefined}
    />
  )
}

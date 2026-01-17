import React, { Fragment } from 'react'
import { ImageMedia } from './ImageMedia'
import { VideoMedia } from './VideoMedia'

export interface Props {
  className?: string
  htmlElement?: React.ElementType | null
  imgClassName?: string
  resource?: any
  priority?: boolean
  fill?: boolean
  src?: string
  alt?: string
}

export const Media: React.FC<Props> = (props) => {
  const { className, htmlElement = 'div', resource } = props

  const isVideo = typeof resource === 'object' && resource?.mimeType?.includes('video')
  const Tag = (htmlElement as React.ElementType) || Fragment

  return (
    <Tag
      {...(htmlElement !== null
        ? {
            className,
          }
        : {})}
    >
      {isVideo ? <VideoMedia {...props} /> : <ImageMedia {...props} />}
    </Tag>
  )
}

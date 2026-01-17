'use client'

import { cn } from '@/lib/utils'
import React, { useEffect, useRef } from 'react'

import type { Props as MediaProps } from '.'

export const VideoMedia: React.FC<MediaProps> = (props) => {
  const { className, resource } = props

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const { current: video } = videoRef
    if (video) {
      video.addEventListener('suspend', () => {
        // Handle video suspend
      })
    }
  }, [])

  if (resource && typeof resource === 'object') {
    const { url } = resource

    return (
      <video
        autoPlay
        className={cn(className)}
        controls={false}
        loop
        muted
        playsInline
        ref={videoRef}
      >
        <source src={url || ''} />
      </video>
    )
  }

  return null
}

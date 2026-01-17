import React from 'react'
import { cn } from '@/lib/utils'
import RichText from '@/components/RichText'

import type { BannerBlock as BannerBlockProps } from '@/payload-types'

type Props = {
  className?: string
} & BannerBlockProps

export const BannerBlock: React.FC<Props> = ({ className, content, style }) => {
  return (
    <div className={cn('mx-auto my-8 w-full', className)}>
      <div
        className={cn('border py-3 px-6 flex items-center rounded', {
          'border-border bg-card': style === 'info',
          'border-yellow-500/50 bg-yellow-500/10': style === 'warning',
          'border-red-500/50 bg-red-500/10': style === 'error',
          'border-green-500/50 bg-green-500/10': style === 'success',
        })}
      >
        <RichText data={content} enableGutter={false} enableProse={false} />
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import RichText from '@/components/RichText'

import type { Page } from '@/payload-types'

export const LowImpactHero: React.FC<Page['hero']> = ({ richText }) => {
  return (
    <div className="container mt-16">
      <div className="max-w-[48rem]">
        {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}
      </div>
    </div>
  )
}

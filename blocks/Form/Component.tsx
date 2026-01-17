'use client'

import React from 'react'
import RichText from '@/components/RichText'

import type { FormBlock as FormBlockProps } from '@/payload-types'

export const FormBlock: React.FC<
  FormBlockProps & {
    id?: string
  }
> = (props) => {
  const { enableIntro, introContent, form } = props

  return (
    <div className="container my-16">
      {enableIntro && introContent && (
        <RichText className="mb-8 lg:mb-12" data={introContent} enableGutter={false} />
      )}
      <div className="max-w-[48rem]">
        {/* Form rendering would go here - integrate with your forms collection */}
        <p className="text-muted-foreground">
          Form ID: {typeof form === 'object' ? form.id : form}
        </p>
      </div>
    </div>
  )
}

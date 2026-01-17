'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type CodeBlockProps = {
  className?: string
  code: string
  language?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ className, code, language }) => {
  return (
    <div className={cn('my-4', className)}>
      <pre className="border border-border rounded bg-card p-4 overflow-x-auto">
        <code className={`language-${language || 'plaintext'} text-sm`}>{code}</code>
      </pre>
    </div>
  )
}

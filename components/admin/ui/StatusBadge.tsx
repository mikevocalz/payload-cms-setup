'use client'

import React from 'react'
import { Badge } from './Badge'

interface StatusBadgeProps {
  status: 'draft' | 'published' | 'archived' | 'pending' | string
  className?: string
}

const statusVariantMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'warning',
  published: 'success',
  archived: 'default',
  pending: 'info',
  active: 'success',
  inactive: 'default',
}

const statusLabelMap: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
  pending: 'Pending',
  active: 'Active',
  inactive: 'Inactive',
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const variant = statusVariantMap[status.toLowerCase()] || 'default'
  const label = statusLabelMap[status.toLowerCase()] || status

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

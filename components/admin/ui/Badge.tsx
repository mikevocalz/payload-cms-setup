'use client'

import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles: Record<string, string> = {
  default: 'admin-badge--default',
  primary: 'admin-badge--primary',
  success: 'admin-badge--success',
  warning: 'admin-badge--warning',
  error: 'admin-badge--error',
  info: 'admin-badge--info',
}

const sizeStyles: Record<string, string> = {
  sm: 'admin-badge--sm',
  md: 'admin-badge--md',
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  return (
    <span className={`admin-badge ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  )
}

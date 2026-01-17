'use client'

import React from 'react'

interface IconButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  title?: string
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

const variantStyles: Record<string, string> = {
  default: 'icon-button--default',
  primary: 'icon-button--primary',
  danger: 'icon-button--danger',
  ghost: 'icon-button--ghost',
}

const sizeStyles: Record<string, string> = {
  sm: 'icon-button--sm',
  md: 'icon-button--md',
  lg: 'icon-button--lg',
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  title,
  disabled = false,
  className = '',
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`icon-button ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  )
}

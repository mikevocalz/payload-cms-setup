'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import type { StatsCardProps } from './types'

const colorClasses = {
  default: 'stats-card--default',
  primary: 'stats-card--primary',
  success: 'stats-card--success',
  warning: 'stats-card--warning',
  error: 'stats-card--error',
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  href,
  color = 'default',
}) => {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    }
  }

  return (
    <div
      className={`stats-card ${colorClasses[color]} ${href ? 'stats-card--clickable' : ''}`}
      onClick={handleClick}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={(e) => {
        if (href && (e.key === 'Enter' || e.key === ' ')) {
          handleClick()
        }
      }}
    >
      <div className="stats-card__header">
        <span className="stats-card__title">{title}</span>
        {icon && <div className="stats-card__icon">{icon}</div>}
      </div>
      
      <div className="stats-card__value">{value}</div>
      
      <div className="stats-card__footer">
        {subtitle && <span className="stats-card__subtitle">{subtitle}</span>}
        {trend && (
          <span className={`stats-card__trend ${trend.isPositive ? 'stats-card__trend--positive' : 'stats-card__trend--negative'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  )
}

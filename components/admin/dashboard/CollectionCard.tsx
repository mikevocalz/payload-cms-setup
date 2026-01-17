'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

interface CollectionCardProps {
  slug: string
  label: string
  description?: string
  count?: number
  icon?: React.ReactNode
  group?: string
}

function DefaultIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  slug,
  label,
  description,
  count,
  icon,
  group,
}) => {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/admin/collections/${slug}`)
  }

  const handleCreate = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/admin/collections/${slug}/create`)
  }

  return (
    <div
      className="collection-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick()
        }
      }}
    >
      <div className="collection-card__header">
        <div className="collection-card__icon">
          {icon || <DefaultIcon />}
        </div>
        {group && <span className="collection-card__group">{group}</span>}
      </div>
      
      <div className="collection-card__body">
        <h4 className="collection-card__title">{label}</h4>
        {description && (
          <p className="collection-card__description">{description}</p>
        )}
        {typeof count === 'number' && (
          <span className="collection-card__count">
            {count.toLocaleString()} {count === 1 ? 'document' : 'documents'}
          </span>
        )}
      </div>

      <div className="collection-card__footer">
        <button
          type="button"
          className="collection-card__create-btn"
          onClick={handleCreate}
        >
          Create New
        </button>
        <div className="collection-card__arrow">
          <ArrowRightIcon />
        </div>
      </div>
    </div>
  )
}

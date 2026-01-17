'use client'

import React from 'react'
import { useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

interface QuickActionsProps {
  maxActions?: number
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  )
}

const priorityCollections = ['posts', 'users', 'media', 'events', 'stories']

export const QuickActions: React.FC<QuickActionsProps> = ({ maxActions = 6 }) => {
  const { config } = useConfig()
  const router = useRouter()
  
  const collections = config.collections || []
  
  const sortedCollections = [...collections].sort((a, b) => {
    const aIndex = priorityCollections.indexOf(a.slug)
    const bIndex = priorityCollections.indexOf(b.slug)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const displayCollections = sortedCollections.slice(0, maxActions)

  const handleCreate = (slug: string) => {
    router.push(`/admin/collections/${slug}/create`)
  }

  const handleViewAll = (slug: string) => {
    router.push(`/admin/collections/${slug}`)
  }

  return (
    <div className="quick-actions">
      <h3 className="quick-actions__title">Quick Actions</h3>
      <div className="quick-actions__grid">
        {displayCollections.map((collection) => {
          const label = typeof collection.labels?.singular === 'string'
            ? collection.labels.singular
            : collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1)

          const canCreate = true

          return (
            <div key={collection.slug} className="quick-action-group">
              <span className="quick-action-group__label">{label}</span>
              <div className="quick-action-group__buttons">
                {canCreate && (
                  <button
                    type="button"
                    className="quick-action-btn quick-action-btn--primary"
                    onClick={() => handleCreate(collection.slug)}
                  >
                    <PlusIcon />
                    <span>Create</span>
                  </button>
                )}
                <button
                  type="button"
                  className="quick-action-btn quick-action-btn--secondary"
                  onClick={() => handleViewAll(collection.slug)}
                >
                  <ListIcon />
                  <span>View All</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

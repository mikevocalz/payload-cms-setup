'use client'

import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import type { ActivityItem } from './types'

interface RecentActivityProps {
  limit?: number
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function getActionColor(action: string): string {
  switch (action) {
    case 'create': return 'activity-item__action--create'
    case 'update': return 'activity-item__action--update'
    case 'delete': return 'activity-item__action--delete'
    default: return ''
  }
}

function getActionIcon(action: string): React.ReactNode {
  switch (action) {
    case 'create':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'update':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      )
    case 'delete':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      )
    default:
      return null
  }
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ limit = 10 }) => {
  const { config } = useConfig()
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const collections = config.collections || []
        const activityPromises = collections
          .filter(col => !col.slug.includes('payload'))
          .slice(0, 5)
          .map(async (collection) => {
            try {
              const response = await fetch(
                `/api/${collection.slug}?limit=3&depth=0&sort=-updatedAt`
              )
              const data = await response.json()
              
              const label = typeof collection.labels?.singular === 'string'
                ? collection.labels.singular
                : collection.slug

              return (data.docs || []).map((doc: any) => ({
                id: `${collection.slug}-${doc.id}`,
                collection: collection.slug,
                collectionLabel: label,
                documentId: doc.id,
                documentTitle: doc.title || doc.name || doc.email || doc.username || `${label} #${doc.id}`,
                action: 'update' as const,
                timestamp: new Date(doc.updatedAt || doc.createdAt),
              }))
            } catch {
              return []
            }
          })

        const results = await Promise.all(activityPromises)
        const flatResults = results.flat()
        
        flatResults.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        
        setActivities(flatResults.slice(0, limit))
      } catch (error) {
        console.error('Failed to fetch activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentActivity()
  }, [config.collections, limit])

  const handleItemClick = (activity: ActivityItem) => {
    router.push(`/admin/collections/${activity.collection}/${activity.documentId}`)
  }

  if (loading) {
    return (
      <div className="recent-activity recent-activity--loading">
        <h3 className="recent-activity__title">Recent Activity</h3>
        <div className="recent-activity__list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="activity-item activity-item--skeleton">
              <div className="skeleton skeleton--circle" />
              <div className="activity-item__content">
                <div className="skeleton skeleton--text" />
                <div className="skeleton skeleton--text-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="recent-activity recent-activity--empty">
        <h3 className="recent-activity__title">Recent Activity</h3>
        <div className="recent-activity__empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p>No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recent-activity">
      <h3 className="recent-activity__title">Recent Activity</h3>
      <div className="recent-activity__list">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="activity-item"
            onClick={() => handleItemClick(activity)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleItemClick(activity)
              }
            }}
          >
            <div className={`activity-item__icon ${getActionColor(activity.action)}`}>
              {getActionIcon(activity.action)}
            </div>
            <div className="activity-item__content">
              <span className="activity-item__title">{activity.documentTitle}</span>
              <span className="activity-item__meta">
                {activity.collectionLabel} • {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
            <div className="activity-item__arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

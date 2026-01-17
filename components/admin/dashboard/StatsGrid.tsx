'use client'

import React, { useEffect, useState } from 'react'
import { useConfig } from '@payloadcms/ui'
import { StatsCard } from './StatsCard'
import type { CollectionStats } from './types'

interface StatsGridProps {
  limit?: number
}

const collectionIcons: Record<string, React.ReactNode> = {
  users: <UsersIcon />,
  posts: <DocumentIcon />,
  media: <ImageIcon />,
  comments: <ChatIcon />,
  messages: <MessageIcon />,
  notifications: <BellIcon />,
  default: <FolderIcon />,
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  )
}

export const StatsGrid: React.FC<StatsGridProps> = ({ limit = 8 }) => {
  const { config } = useConfig()
  const [stats, setStats] = useState<CollectionStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const collections = config.collections || []
        const statsPromises = collections.slice(0, limit).map(async (collection) => {
          try {
            const response = await fetch(`/api/${collection.slug}?limit=0&depth=0`)
            const data = await response.json()
            
            const label = typeof collection.labels?.plural === 'string' 
              ? collection.labels.plural 
              : collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1)

            return {
              slug: collection.slug,
              label,
              count: data.totalDocs || 0,
              recentCount: 0,
              group: collection.admin?.group,
            } as CollectionStats
          } catch {
            return {
              slug: collection.slug,
              label: collection.slug,
              count: 0,
              recentCount: 0,
            } as CollectionStats
          }
        })

        const results = await Promise.all(statsPromises)
        setStats(results)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [config.collections, limit])

  if (loading) {
    return (
      <div className="stats-grid stats-grid--loading">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="stats-card stats-card--skeleton">
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--value" />
            <div className="skeleton skeleton--subtitle" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <StatsCard
          key={stat.slug}
          title={stat.label}
          value={stat.count.toLocaleString()}
          subtitle="Total documents"
          icon={collectionIcons[stat.slug] || collectionIcons.default}
          href={`/admin/collections/${stat.slug}`}
        />
      ))}
    </div>
  )
}

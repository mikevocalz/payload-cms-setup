'use client'

import React, { useMemo } from 'react'
import { useConfig, useAuth } from '@payloadcms/ui'
import { useRouter, usePathname } from 'next/navigation'
import { NavGroup } from './NavGroup'
import './navigation.css'

interface GroupedCollections {
  [key: string]: Array<{
    slug: string
    label: string
    href: string
  }>
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}

const collectionGroups: Record<string, string[]> = {
  'Content': ['posts', 'stories', 'media', 'comments', 'reactions', 'hashtags', 'likes'],
  'Users': ['users', 'profiles', 'accounts', 'follows', 'blocks'],
  'Messaging': ['conversations', 'messages', 'notifications'],
  'Engagement': ['bookmarks', 'user-tags', 'events', 'event-rsvps', 'story-views'],
  'Moderation': ['reports', 'moderation-actions', 'content-flags', 'device-bans'],
  'Monetization': ['subscription-tiers', 'subscriptions', 'transactions'],
  'System': ['settings', 'feature-flags'],
}

export const CustomNavigation: React.FC = () => {
  const { config } = useConfig()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const groupedCollections = useMemo(() => {
    const collections = config.collections || []
    const groups: GroupedCollections = {}
    const ungrouped: Array<{ slug: string; label: string; href: string }> = []

    collections.forEach(collection => {
      const label = typeof collection.labels?.plural === 'string'
        ? collection.labels.plural
        : collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1).replace(/-/g, ' ')

      const item = {
        slug: collection.slug,
        label,
        href: `/admin/collections/${collection.slug}`,
      }

      let found = false
      for (const [groupName, slugs] of Object.entries(collectionGroups)) {
        if (slugs.includes(collection.slug)) {
          if (!groups[groupName]) groups[groupName] = []
          groups[groupName].push(item)
          found = true
          break
        }
      }

      if (!found) {
        ungrouped.push(item)
      }
    })

    if (ungrouped.length > 0) {
      groups['Other'] = ungrouped
    }

    return groups
  }, [config.collections])

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <nav className="custom-nav">
      <div className="custom-nav__header">
        <div className="custom-nav__brand">
          <span className="custom-nav__logo">CC</span>
          <span className="custom-nav__title">Counter Culture</span>
        </div>
      </div>

      <div className="custom-nav__content">
        <div className="custom-nav__section">
          <a
            href="/admin"
            className={`custom-nav__item ${pathname === '/admin' ? 'custom-nav__item--active' : ''}`}
          >
            <HomeIcon />
            <span>Dashboard</span>
          </a>
        </div>

        {Object.entries(groupedCollections).map(([groupName, items]) => (
          <NavGroup key={groupName} label={groupName} items={items} currentPath={pathname} />
        ))}
      </div>

      <div className="custom-nav__footer">
        {user && (
          <div className="custom-nav__user">
            <div className="custom-nav__user-avatar">
              {(user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="custom-nav__user-info">
              <span className="custom-nav__user-name">
                {user.username || user.email?.split('@')[0] || 'User'}
              </span>
              <span className="custom-nav__user-role">
                {(user as any).role || 'Admin'}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          className="custom-nav__logout"
          onClick={handleLogout}
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}

export default CustomNavigation

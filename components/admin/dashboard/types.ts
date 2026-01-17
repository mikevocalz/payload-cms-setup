import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload'

export interface CollectionStats {
  slug: string
  label: string
  count: number
  recentCount: number
  icon?: string
  group?: string
}

export interface ActivityItem {
  id: string | number
  collection: string
  collectionLabel: string
  documentId: string | number
  documentTitle: string
  action: 'create' | 'update' | 'delete'
  timestamp: Date
  user?: {
    id: string | number
    email?: string
    name?: string
  }
}

export interface DashboardProps {
  collections: SanitizedCollectionConfig[]
  globals: SanitizedGlobalConfig[]
}

export interface StatsCardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
  href?: string
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error'
}

export interface QuickActionProps {
  label: string
  href: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
}

export type CollectionGroup = {
  label: string
  collections: CollectionStats[]
}

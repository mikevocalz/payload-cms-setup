'use client'

import React from 'react'
import { useConfig, useAuth } from '@payloadcms/ui'
import { StatsGrid } from './StatsGrid'
import { RecentActivity } from './RecentActivity'
import { QuickActions } from './QuickActions'
import './dashboard.css'

function WelcomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export const Dashboard: React.FC = () => {
  const { config } = useConfig()
  const { user } = useAuth()

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const userName = user?.username || user?.email?.split('@')[0] || 'there'

  return (
    <div className="custom-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__content">
          <div className="dashboard-header__greeting">
            <WelcomeIcon />
            <div>
              <h1 className="dashboard-header__title">
                {greeting}, {userName}
              </h1>
              <p className="dashboard-header__subtitle">
                Here's what's happening with your app today.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-section">
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Overview</h2>
            <span className="dashboard-section__badge">
              {config.collections?.length || 0} Collections
            </span>
          </div>
          <StatsGrid limit={8} />
        </section>

        <div className="dashboard-grid">
          <section className="dashboard-section dashboard-section--activity">
            <RecentActivity limit={8} />
          </section>

          <section className="dashboard-section dashboard-section--actions">
            <QuickActions maxActions={6} />
          </section>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

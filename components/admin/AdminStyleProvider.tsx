'use client'

import React from 'react'
import './admin-styles.css'
import './dashboard/dashboard.css'
import './views/list-view.css'
import './ui/ui-styles.css'
import './navigation/navigation.css'

export const AdminStyleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export default AdminStyleProvider

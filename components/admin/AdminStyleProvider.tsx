'use client'

import React from 'react'
import './admin-styles.css'

export const AdminStyleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export default AdminStyleProvider

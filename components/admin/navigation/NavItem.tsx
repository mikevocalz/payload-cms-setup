'use client'

import React from 'react'
import Link from 'next/link'

interface NavItemProps {
  href: string
  label: string
  isActive?: boolean
  icon?: React.ReactNode
}

export const NavItem: React.FC<NavItemProps> = ({ href, label, isActive = false, icon }) => {
  return (
    <Link
      href={href}
      className={`nav-item ${isActive ? 'nav-item--active' : ''}`}
    >
      {icon && <span className="nav-item__icon">{icon}</span>}
      <span className="nav-item__label">{label}</span>
    </Link>
  )
}

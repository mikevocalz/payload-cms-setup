'use client'

import React, { useState } from 'react'
import { NavItem } from './NavItem'

interface NavGroupProps {
  label: string
  items: Array<{
    slug: string
    label: string
    href: string
  }>
  currentPath: string
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
      }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export const NavGroup: React.FC<NavGroupProps> = ({ label, items, currentPath }) => {
  const hasActiveItem = items.some(item => currentPath.startsWith(item.href))
  const [isOpen, setIsOpen] = useState(hasActiveItem)

  return (
    <div className={`nav-group ${isOpen ? 'nav-group--open' : ''}`}>
      <button
        type="button"
        className="nav-group__toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="nav-group__label">{label}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className="nav-group__items">
          {items.map(item => (
            <NavItem
              key={item.slug}
              href={item.href}
              label={item.label}
              isActive={currentPath.startsWith(item.href)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

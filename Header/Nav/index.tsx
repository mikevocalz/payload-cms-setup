'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const HeaderNav: React.FC = () => {
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Posts', href: '/posts' },
  ]

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ label, href }, i) => (
        <Link
          key={i}
          href={href}
          className={cn('text-sm hover:text-primary transition-colors')}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

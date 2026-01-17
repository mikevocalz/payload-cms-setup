import React from 'react'
import Link from 'next/link'
import { CMSLink } from '@/components/Link'

export const Footer: React.FC = () => {
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Posts', href: '/posts' },
  ]

  return (
    <footer className="border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <span className="text-xl font-bold">Logo</span>
        </Link>
        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ label, href }, i) => (
              <Link
                key={i}
                href={href}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}

import React from 'react'
import Link from 'next/link'
import { HeaderNav } from './Nav'

export const Header: React.FC = async () => {
  return (
    <header className="container relative z-20">
      <div className="py-8 flex justify-between">
        <Link href="/">
          <span className="text-xl font-bold">Logo</span>
        </Link>
        <HeaderNav />
      </div>
    </header>
  )
}

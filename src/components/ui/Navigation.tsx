'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import SignOutButton from '../SignOutButton'

interface NavigationProps {
  className?: string
}

export function Navigation({ className = '' }: NavigationProps) {
  const { data: session } = useSession()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', roles: ['admin', 'contractor', 'client'] },
    { href: '/projects', label: 'Projects', roles: ['admin', 'contractor', 'client'] },
    { href: '/proposals', label: 'Proposals', roles: ['admin', 'contractor'] },
    { href: '/profile', label: 'Profile', roles: ['admin', 'contractor', 'client'] },
  ]

  const userRole = session?.user?.role || 'client'

  return (
    <nav className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Clean Glass Proposals
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems
                .filter(item => item.roles.includes(userRole))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <SignOutButton />
              </div>
            ) : (
              <div className="space-x-2">
                <Link
                  href="/auth/signin"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 
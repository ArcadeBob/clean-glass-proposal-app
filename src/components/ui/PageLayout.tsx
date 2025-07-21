import { ReactNode } from 'react'
import { Navigation } from './Navigation'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  showNavigation?: boolean
  className?: string
}

export function PageLayout({ 
  children, 
  title, 
  showNavigation = true,
  className = '' 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && <Navigation />}
      
      <main className={`${showNavigation ? 'pt-4' : ''} ${className}`}>
        {title && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}

interface CardProps {
  children: ReactNode
  title?: string
  className?: string
}

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      {title && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-4 py-5 sm:p-6">
        {children}
      </div>
    </div>
  )
} 
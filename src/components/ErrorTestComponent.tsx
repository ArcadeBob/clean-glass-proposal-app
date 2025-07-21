'use client'

import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useState } from 'react'

interface ErrorTestComponentProps {
  shouldThrow?: boolean
}

export function ErrorTestComponent({ shouldThrow = false }: ErrorTestComponentProps) {
  const [count, setCount] = useState(0)
  const { handleError, handleAsyncError } = useErrorHandler()

  // Component that throws an error when count reaches 5
  if (shouldThrow || count >= 5) {
    throw new Error('This is a test error from ErrorTestComponent')
  }

  const triggerAsyncError = async () => {
    await handleAsyncError(async () => {
      // Simulate an async error
      await new Promise(resolve => setTimeout(resolve, 100))
      throw new Error('Async error test')
    })
  }

  const handleSyncError = () => {
    try {
      throw new Error('Sync error test')
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-medium mb-4">Error Test Component</h3>
      <p className="mb-4">Count: {count}</p>
      <div className="space-y-2">
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Increment (will throw at 5)
        </button>
        <button
          onClick={handleSyncError}
          className="block px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Trigger Sync Error
        </button>
        <button
          onClick={() => triggerAsyncError()}
          className="block px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Trigger Async Error
        </button>
      </div>
    </div>
  )
}

// Component wrapped with error boundary
export const ErrorTestComponentWithBoundary = ({ shouldThrow }: ErrorTestComponentProps) => {
  return (
    <div className="p-4 border rounded-lg bg-green-50">
      <h3 className="text-lg font-medium mb-4">Error Test Component (with Boundary)</h3>
      <ErrorTestComponent shouldThrow={shouldThrow} />
    </div>
  )
} 
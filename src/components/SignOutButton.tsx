"use client"

import { signOut } from "next-auth/react"

export default function SignOutButton() {
  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: "/",
        redirect: true 
      })
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
    >
      Sign Out
    </button>
  )
} 
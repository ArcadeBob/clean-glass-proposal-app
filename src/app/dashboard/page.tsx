import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SignOutButton from "@/components/SignOutButton"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Clean Glass Proposal
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {session.user?.name || session.user?.email}!
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Welcome to your Clean Glass Proposal dashboard. This is a protected page that requires authentication.
              </p>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  User Information
                </h3>
                <div className="space-y-2 text-left">
                  <p><strong>Name:</strong> {session.user?.name || "Not provided"}</p>
                  <p><strong>Email:</strong> {session.user?.email}</p>
                  <p><strong>Role:</strong> {session.user?.role}</p>
                  <p><strong>User ID:</strong> {session.user?.id}</p>
                </div>
              </div>

              <div className="mt-8 space-x-4">
                <a
                  href="/profile"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  View Profile
                </a>
                <a
                  href="/proposals"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Manage Proposals
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 
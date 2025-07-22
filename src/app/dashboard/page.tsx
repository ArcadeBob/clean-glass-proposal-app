import SignOutButton from '@/components/SignOutButton';
import HistoricalReportDashboard from '@/components/dashboard/HistoricalReportDashboard';
import MarketDataUpload from '@/components/dashboard/MarketDataUpload';
import ProposalDashboard from '@/components/dashboard/ProposalDashboard';
import RiskDashboardDemo from '@/components/dashboard/RiskDashboardDemo';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Clean Glass Proposals
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
        <div className="px-4 py-6 sm:px-0 space-y-8">
          <ProposalDashboard userId={session.user.id} />
          <RiskDashboardDemo />
          <MarketDataUpload />
          <HistoricalReportDashboard />
        </div>
      </main>
    </div>
  );
}

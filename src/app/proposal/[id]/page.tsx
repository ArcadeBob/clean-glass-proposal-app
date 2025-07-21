import ProposalDetailView from '@/components/proposal/ProposalDetailView';
import { auth } from '@/lib/auth';
import { getProposalById } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';

interface ProposalPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect('/auth/signin');
  }

  // Get proposal data
  const proposal = await getProposalById(id, session.user.id);

  if (!proposal) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← Back to Dashboard
              </a>
              <h1 className="text-xl font-bold text-gray-900">
                Proposal Details
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <ProposalDetailView proposal={proposal} />
        </div>
      </main>
    </div>
  );
}

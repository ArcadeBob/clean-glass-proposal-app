'use client';

import { Copy, Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Proposal {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  totalAmount: number;
  projectName?: string;
  projectType?: string;
  proposalDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ProposalDashboardProps {
  userId: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const statusLabels = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export default function ProposalDashboard({ userId }: ProposalDashboardProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals');
      if (response.ok) {
        const data = await response.json();
        setProposals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (proposalId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setProposals(prev =>
          prev.map(proposal =>
            proposal.id === proposalId
              ? { ...proposal, status: newStatus as Proposal['status'] }
              : proposal
          )
        );
      }
    } catch (error) {
      console.error('Error updating proposal status:', error);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProposals(prev =>
          prev.filter(proposal => proposal.id !== proposalId)
        );
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  const handleDuplicateProposal = async (proposalId: string) => {
    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'duplicate' }),
      });

      if (response.ok) {
        const newProposal = await response.json();
        setProposals(prev => [newProposal.data, ...prev]);
      }
    } catch (error) {
      console.error('Error duplicating proposal:', error);
    }
  };

  const filteredProposals = proposals
    .filter(proposal => {
      const matchesSearch =
        proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.projectName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        proposal.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || proposal.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison =
            new Date(a.proposalDate).getTime() -
            new Date(b.proposalDate).getTime();
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'name':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: proposals.length };
    Object.keys(statusLabels).forEach(status => {
      counts[status] = proposals.filter(p => p.status === status).length;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Proposal Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track your glass proposals
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/proposal/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">
              {statusCounts[status]}
            </div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              {Object.entries(statusLabels).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e =>
                setSortBy(e.target.value as 'date' | 'amount' | 'name')
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="name">Sort by Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="bg-white shadow rounded-lg">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No proposals found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first proposal'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                href="/proposal/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Proposal
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proposal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProposals.map(proposal => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {proposal.title}
                        </div>
                        {proposal.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {proposal.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {proposal.projectName || 'N/A'}
                      </div>
                      {proposal.projectType && (
                        <div className="text-sm text-gray-500">
                          {proposal.projectType}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={proposal.status}
                        onChange={e =>
                          handleStatusChange(proposal.id, e.target.value)
                        }
                        className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[proposal.status]}`}
                      >
                        {Object.entries(statusLabels).map(([status, label]) => (
                          <option key={status} value={status}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${proposal.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(proposal.proposalDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDuplicateProposal(proposal.id)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/proposal/${proposal.id}`}
                          className="text-gray-400 hover:text-gray-600"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/proposal/${proposal.id}/edit`}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProposal(proposal.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { Copy, Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
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

const ITEMS_PER_PAGE = 10;

export default function ProposalDashboard({ userId }: ProposalDashboardProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProposals, setSelectedProposals] = useState<Set<string>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [showBulkActions, setShowBulkActions] = useState(false);

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
        // Optimistic update
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
        // Optimistic update
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
        // Optimistic update
        setProposals(prev => [newProposal.data, ...prev]);
      }
    } catch (error) {
      console.error('Error duplicating proposal:', error);
    }
  };

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedProposals.size === filteredProposals.length) {
      setSelectedProposals(new Set());
    } else {
      setSelectedProposals(new Set(filteredProposals.map(p => p.id)));
    }
  };

  const handleSelectProposal = (proposalId: string) => {
    const newSelected = new Set(selectedProposals);
    if (newSelected.has(proposalId)) {
      newSelected.delete(proposalId);
    } else {
      newSelected.add(proposalId);
    }
    setSelectedProposals(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedProposals.size === 0) return;

    const selectedIds = Array.from(selectedProposals);

    try {
      if (bulkAction === 'delete') {
        if (
          !confirm(
            `Are you sure you want to delete ${selectedIds.length} proposal(s)?`
          )
        ) {
          return;
        }

        const response = await fetch('/api/proposals/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'delete',
            proposalIds: selectedIds,
          }),
        });

        if (response.ok) {
          // Optimistic update for delete
          setProposals(prev => prev.filter(p => !selectedIds.includes(p.id)));
        } else {
          throw new Error('Failed to delete proposals');
        }
      } else if (bulkAction.startsWith('status:')) {
        const newStatus = bulkAction.split(':')[1];

        const response = await fetch('/api/proposals/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'status',
            proposalIds: selectedIds,
            status: newStatus,
          }),
        });

        if (response.ok) {
          // Optimistic update for status change
          setProposals(prev =>
            prev.map(proposal =>
              selectedIds.includes(proposal.id)
                ? { ...proposal, status: newStatus as Proposal['status'] }
                : proposal
            )
          );
        } else {
          throw new Error('Failed to update proposal status');
        }
      }

      // Clear selection and action
      setSelectedProposals(new Set());
      setBulkAction('');
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform bulk action. Please try again.');
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

  // Pagination
  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProposals = filteredProposals.slice(startIndex, endIndex);

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
        <div className="flex flex-col lg:flex-row gap-4">
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
          <div className="flex flex-col sm:flex-row gap-2">
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

      {/* Bulk Actions */}
      {selectedProposals.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedProposals.size} proposal(s) selected
              </span>
              <button
                onClick={() => setSelectedProposals(new Set())}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={bulkAction}
                onChange={e => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select action...</option>
                <option value="delete">Delete Selected</option>
                <option value="status:DRAFT">Mark as Draft</option>
                <option value="status:SENT">Mark as Sent</option>
                <option value="status:ACCEPTED">Mark as Accepted</option>
                <option value="status:REJECTED">Mark as Rejected</option>
                <option value="status:EXPIRED">Mark as Expired</option>
                <option value="status:CANCELLED">Mark as Cancelled</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <input
                      type="checkbox"
                      checked={
                        selectedProposals.size === filteredProposals.length &&
                        filteredProposals.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
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
                {paginatedProposals.map(proposal => (
                  <tr key={proposal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProposals.has(proposal.id)}
                        onChange={() => handleSelectProposal(proposal.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredProposals.length)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{filteredProposals.length}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

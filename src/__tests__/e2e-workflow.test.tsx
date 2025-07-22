import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import ProposalWizard from '../components/wizard/ProposalWizard';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children, session }: any) => children,
  useSession: jest.fn(),
}));

import { SessionProvider, useSession } from 'next-auth/react';

// Mock NextAuth
const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const mockUserSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'USER',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock fetch for API calls
global.fetch = jest.fn();

describe('End-to-End Application Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Proposal Creation Workflow', () => {
    beforeEach(() => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
      });
    });

    test('should render proposal wizard', async () => {
      render(
        <SessionProvider session={mockUserSession}>
          <ProposalWizard />
        </SessionProvider>
      );

      // Check that the wizard renders
      await waitFor(() => {
        expect(screen.getByText('Create Glass Proposal')).toBeInTheDocument();
      });

      // Check that the first step is rendered (use the step indicator text)
      expect(
        screen.getByText('Project Details', { selector: 'h3' })
      ).toBeInTheDocument();
    });

    test('should handle form validation errors', async () => {
      const user = userEvent.setup();

      render(
        <SessionProvider session={mockUserSession}>
          <ProposalWizard />
        </SessionProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Create Glass Proposal')).toBeInTheDocument();
      });

      // Try to proceed without filling required fields
      await user.click(screen.getAllByText('Next')[0]);

      // Should show validation errors
      await waitFor(() => {
        expect(
          screen.getByText(/Project name is required/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Admin Dashboard Workflow', () => {
    test('should display admin dashboard for admin users', async () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
      });

      render(
        <SessionProvider session={mockSession}>
          <AdminDashboard />
        </SessionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });

    test('should deny access to non-admin users', () => {
      (useSession as jest.Mock).mockReturnValue({
        data: {
          user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
            role: 'USER', // Non-admin role
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
      });

      render(
        <SessionProvider session={mockUserSession}>
          <AdminDashboard />
        </SessionProvider>
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/don't have permission/)).toBeInTheDocument();
    });
  });

  describe('Error Handling Workflow', () => {
    test('should handle validation errors in forms', async () => {
      const user = userEvent.setup();

      render(
        <SessionProvider session={mockUserSession}>
          <ProposalWizard />
        </SessionProvider>
      );

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByText('Create Glass Proposal')).toBeInTheDocument();
      });

      // Try to submit with invalid data
      await user.type(screen.getByLabelText(/Square Footage/), '-100');
      await user.click(screen.getAllByText('Next')[0]);

      // Should show validation error - try different error messages
      await waitFor(() => {
        const errorElement =
          screen.queryByText(/Square footage must be greater than 0/) ||
          screen.queryByText(/Square footage must be positive/) ||
          screen.queryByText(/Square footage/);
        expect(errorElement).toBeInTheDocument();
      });
    });
  });
});

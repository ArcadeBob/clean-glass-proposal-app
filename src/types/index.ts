// Core application data types for Clean Glass Proposal App

// User related types
export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  role: 'admin' | 'contractor' | 'client';
  phone?: string;
  company?: string;
  address?: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

// Project related types
export interface Project {
  id: string;
  name: string;
  description?: string;
  address: Address;
  clientId: string;
  client?: UserProfile;
  contractorId?: string;
  contractor?: UserProfile;
  status: ProjectStatus;
  startDate?: Date;
  expectedCompletion?: Date;
  createdAt: Date;
  updatedAt: Date;
  proposals: Proposal[];
}

export type ProjectStatus =
  | 'planning'
  | 'bidding'
  | 'awarded'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

// Proposal related types
export interface Proposal {
  id: string;
  projectId: string;
  project?: Project;
  contractorId: string;
  contractor?: UserProfile;
  title: string;
  description?: string;
  status: ProposalStatus;
  totalAmount: number;
  currency: string;
  validUntil: Date;
  items: ProposalItem[];
  terms?: string;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export type ProposalStatus =
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export interface ProposalItem {
  id: string;
  proposalId: string;
  type: GlazingType;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  totalPrice: number;
  specifications?: GlazingSpecification;
  notes?: string;
}

// Glazing specific types
export type GlazingType =
  | 'single-pane'
  | 'double-pane'
  | 'triple-pane'
  | 'tempered'
  | 'laminated'
  | 'low-e'
  | 'insulated'
  | 'custom';

export interface GlazingSpecification {
  thickness?: string;
  dimensions: {
    width: number;
    height: number;
    unit: 'inches' | 'feet' | 'mm' | 'cm' | 'm';
  };
  frame?: FrameType;
  glazingType: GlazingType;
  energyRating?: string;
  uvProtection?: boolean;
  soundReduction?: string;
  safety?: SafetyRating;
  warranty?: string;
  installation?: InstallationType;
}

export type FrameType =
  | 'aluminum'
  | 'vinyl'
  | 'wood'
  | 'fiberglass'
  | 'composite';

export type SafetyRating =
  | 'standard'
  | 'tempered'
  | 'laminated'
  | 'hurricane-rated';

export type InstallationType =
  | 'new-construction'
  | 'retrofit'
  | 'replacement'
  | 'repair';

// Form and UI types
export interface ProposalFormData {
  title: string;
  description?: string;
  projectId: string;
  validUntil: string;
  items: ProposalItemFormData[];
  terms?: string;
  notes?: string;
}

export interface ProposalItemFormData {
  type: GlazingType;
  description: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  specifications?: Partial<GlazingSpecification>;
  notes?: string;
}

// Import standardized API response types
export type { ApiResponse, PaginatedApiResponse } from '@/lib/api-response';

// Legacy API response type for backward compatibility
export interface LegacyApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and search types
export interface ProposalFilters {
  status?: ProposalStatus[];
  contractorId?: string;
  projectId?: string;
  minAmount?: number;
  maxAmount?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ProjectFilters {
  status?: ProjectStatus[];
  clientId?: string;
  contractorId?: string;
  location?: {
    state?: string;
    city?: string;
  };
}

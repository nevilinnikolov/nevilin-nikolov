
export interface CompanyLead {
  id: string;
  name: string;
  eik: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  industry: string;
  status: 'active' | 'inactive' | 'pending';
  source: string;
  lastUpdated: string;
}

export interface SearchFilters {
  industry: string;
  city: string;
  limit: number;
  excludedEiks?: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  VALIDATING = 'VALIDATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

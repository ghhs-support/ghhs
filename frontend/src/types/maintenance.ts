import { Property } from './property';

export interface BeepingAlarm {
  id: number;
  uid: string;
  issue_type: {
    id: number;
    name: string;
    description: string;
  };
  notes: string;
  status: BeepingAlarmStatus;
  is_active: boolean;
  property: Property & {
    country: string;
    is_agency: boolean;
    is_private: boolean;
  };
  is_customer_contacted: boolean;
  created_at: string;
  updated_at: string;
  allocation: Array<User>;
}

export interface BeepingAlarmResponse {
  data: BeepingAlarm[];
}

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export type BeepingAlarmStatus = 'new' | 'requires_call_back' | 'awaiting_response' | 'to_be_scheduled' | 'to_be_quoted' | 'completed' | 'cancelled';

export interface Option {
  value: string;
  label: string;
}

export const BEEPING_ALARM_STATUS_OPTIONS: Option[] = [
  { value: 'new', label: 'New' },
  { value: 'requires_call_back', label: 'Requires Call Back' },
  { value: 'awaiting_response', label: 'Awaiting Response' },
  { value: 'to_be_scheduled', label: 'To Be Scheduled' },
  { value: 'to_be_quoted', label: 'To Be Quoted' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const CUSTOMER_CONTACTED_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' }
];

export const AGENCY_PRIVATE_OPTIONS = [
  { value: 'agency', label: 'Agency' },
  { value: 'private', label: 'Private' }
];

export type BeepingAlarmFilterMode = 'single' | 'range';

export interface BeepingAlarmFilters {
  allocation: string | null;
  tenant: string | null;
  status: BeepingAlarmStatus | null;
  customerContacted: string | null;
  property: string | null;
  agencyPrivate: 'agency' | 'private' | null;
  createdAtSingle: string | null;
  createdAtFrom: string | null;
  createdAtTo: string | null;
  createdAtMode: BeepingAlarmFilterMode;
}

export interface CreateBeepingAlarmFormData {
  property: number | null;
  status: string | null;
}

export interface CreateBeepingAlarmProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}


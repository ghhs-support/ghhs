import { Property } from './property';

export interface BeepingAlarm {
  id: number;
  uid: string;
  issue_type: IssueType;
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
  is_completed: boolean;
  is_cancelled: boolean;
}

export interface IssueType {
  id: number;
  name: string;
  description: string;
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

export type BeepingAlarmStatus = 'new' | 'requires_call_back' | 'awaiting_response' | 'to_be_scheduled' | 'to_be_quoted' | 'completed' | 'cancelled' | 'update';

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
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'update', label: 'Update' }
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
  status: string;
  issue_type: number | null;
  allocation: number | null;  // This is still null | number for the form
  allocation_label?: string | null;
  notes: string;
}

// Add this interface for the actual API payload
export interface CreateBeepingAlarmPayload {
  property: number | null;
  status: string;
  issue_type: number | null;
  allocation: number[];  // This is what gets sent to the API
  notes: string;
}

export interface CreateBeepingAlarmProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface BeepingAlarmDetailsCardProps {
  alarm: BeepingAlarm;
  loading?: boolean;
}

export interface BeepingAlarmUpdate {
  id: number;
  uid: string;
  beeping_alarm: number;
  status: BeepingAlarmStatus;
  created_at: string;
  notes: string;
  update_by: User;
}

export interface BeepingAlarmUpdateFormData {
  status: BeepingAlarmStatus;
  notes: string;
}

export interface BeepingAlarmUpdatesCardProps {
  alarmId: number;
  updates: BeepingAlarmUpdate[];
  onUpdateSubmitted: () => void;
  loading?: boolean;
}

export const UPDATE_STATUS_OPTIONS: Option[] = [
  { value: 'update', label: 'Update' },
  { value: 'requires_call_back', label: 'Requires Call Back' },
  { value: 'awaiting_response', label: 'Awaiting Response' },
  { value: 'to_be_scheduled', label: 'To Be Scheduled' },
  { value: 'to_be_quoted', label: 'To Be Quoted' },
];


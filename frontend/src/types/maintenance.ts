export interface BeepingAlarm {
  id: number;
  uid: string;
  status: string;
  issue_type: {
    id: number;
    name: string;
    description: string;
  };
  notes: string;
  is_active: boolean;
  property: {
    id: number;
    unit_number: string | null;
    street_number: string;
    street_name: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
    agency?: {
      id: number;
      name: string;
      email: string;
      phone: string;
    } | null;
    private_owners: Array<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    }>;
    tenants: Array<{
      id: number;
      first_name: string;
      last_name: string;
      phone: string;
    }>;
    is_agency: boolean;
    is_private: boolean;
  };
  is_customer_contacted: boolean;
  created_at: string;
  updated_at: string;
  allocation: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
}

export interface BeepingAlarmResponse {
  data: BeepingAlarm[];
}

export interface Property {
  id: number;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
}

export const formatPropertyAddress = (property: Property) => {
  if (!property) {
    return 'No property data';
  }
  
  const parts = [
    property.unit_number && `Unit ${property.unit_number}`,
    property.street_number,
    property.street_name,
    property.suburb,
    property.state,
    property.postcode
  ].filter(Boolean);
  
  const address = parts.join(' ');
  return address || 'No address data';
};

export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  }

export type BeepingAlarmStatus = 'new' | 'requires_call_back' | 'awaiting_response' | 'to_be_scheduled' | 'to_be_quoted' | 'completed' | 'cancelled';

export const BEEPING_ALARM_STATUS_OPTIONS = [
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


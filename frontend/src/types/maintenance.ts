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


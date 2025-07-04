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
  agency: {
    id: number;
    name: string;
    email: string;
  } | null;
  private_owner: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  is_active: boolean;
  is_agency: boolean;
  is_private_owner: boolean;
  property: {
    id: number;
    unit_number: string | null;
    street_number: string;
    street_name: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
  };
  tenant: Array<{
    id: number;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string;
  }>;
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

interface Property {
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


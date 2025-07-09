export interface Property {
  id: number;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  tenants: Tenant[];
  agency?: Agency;
  private_owners: PrivateOwner[];
  is_active: boolean;
}

export interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

export interface PropertyManager {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface Agency {
  id: number;
  name: string;
  email: string;
  phone: string;
  property_managers: PropertyManager[];
}

export interface PrivateOwner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface PropertyFormData {
  unit_number: string;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  latitude: string;
  longitude: string;
  agency_id: number | null;
}

export interface PropertyFormErrors {
  street_number?: string;
  street_name?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  [key: string]: string | undefined;
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
  
  return parts.join(' ');
};

export const validatePropertyForm = (formData: PropertyFormData): PropertyFormErrors => {
  const errors: PropertyFormErrors = {};
  
  if (!formData.street_number.trim()) {
    errors.street_number = 'Street number is required';
  }
  if (!formData.street_name.trim()) {
    errors.street_name = 'Street name is required';
  }
  if (!formData.suburb.trim()) {
    errors.suburb = 'Suburb is required';
  }
  if (!formData.state.trim()) {
    errors.state = 'State is required';
  }
  if (!formData.postcode.trim()) {
    errors.postcode = 'Postcode is required';
  }
  
  return errors;
};

export const getAgencyDropdownOption = (agencies: Agency[], agencyId: number | null) => {
  if (!agencyId) return null;
  const agency = agencies.find(a => a.id === agencyId);
  if (!agency) return null;
  return {
    value: agency.id.toString(),
    label: agency.name
  };
};

export const getInitialFormData = (): PropertyFormData => ({
  unit_number: '',
  street_number: '',
  street_name: '',
  suburb: '',
  state: '',
  postcode: '',
  country: '',
  latitude: '',
  longitude: '',
  agency_id: null,
});

export const propertyToFormData = (property: Property): PropertyFormData => ({
  unit_number: property.unit_number || '',
  street_number: property.street_number,
  street_name: property.street_name,
  suburb: property.suburb,
  state: property.state,
  postcode: property.postcode,
  country: property.country || '',
  latitude: property.latitude || '',
  longitude: property.longitude || '',
  agency_id: property.agency?.id || null,
});

// Add these new types
export interface PropertyTableColumn {
  key: 'address' | 'owner' | 'tenants';
  label: string;
  width: string;
  align: 'left' | 'center' | 'right';
}

export const PROPERTY_TABLE_COLUMNS: PropertyTableColumn[] = [
  {
    key: 'address',
    label: 'Address',
    width: 'w-64',
    align: 'left'
  },
  {
    key: 'owner',
    label: 'Property Owner',
    width: 'w-48',
    align: 'left'
  },
  {
    key: 'tenants',
    label: 'Tenants',
    width: 'w-40',
    align: 'center'
  }
];

// Add these utility functions
export const formatOwnerDisplay = (property: Property) => {
  if (property.agency) {
    return {
      type: 'agency' as const,
      name: property.agency.name,
      email: property.agency.email
    };
  }
  
  if (property.private_owners.length > 0) {
    const owner = property.private_owners[0];
    return {
      type: 'private' as const,
      name: `${owner.first_name} ${owner.last_name}`,
      email: owner.email
    };
  }
  
  return {
    type: 'none' as const,
    name: 'Unassigned',
    email: ''
  };
};

export const formatTenantsDisplay = (tenants: Tenant[]) => {
  if (tenants.length === 0) {
    return {
      count: 0,
      primary: '',
      isVacant: true
    };
  }

  return {
    count: tenants.length,
    primary: `${tenants[0].first_name} ${tenants[0].last_name}`,
    isVacant: false
  };
};

// Tenant form types and utilities
export interface TenantFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

export interface TenantFormErrors {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  [key: string]: string | undefined;
}

export const getInitialTenantFormData = (): TenantFormData => ({
  first_name: '',
  last_name: '',
  phone: '',
  email: ''
});

export const validateTenantForm = (formData: TenantFormData): TenantFormErrors => {
  const errors: TenantFormErrors = {};
  
  if (!formData.first_name.trim()) {
    errors.first_name = 'First name is required';
  }
  if (!formData.last_name.trim()) {
    errors.last_name = 'Last name is required';
  }
  if (!formData.phone.trim()) {
    errors.phone = 'Phone is required';
  }
  
  return errors;
};

export const tenantToFormData = (tenant: Tenant): TenantFormData => ({
  first_name: tenant.first_name,
  last_name: tenant.last_name,
  phone: tenant.phone,
  email: tenant.email || ''
});

// Enhanced property form validation with owner validation
export const validatePropertyFormWithOwner = (
  formData: PropertyFormData,
  ownerType: 'agency' | 'private',
  selectedPrivateOwners: { value: string; label: string }[]
): PropertyFormErrors => {
  const errors = validatePropertyForm(formData);
  
  // Add owner validation
  if (ownerType === 'agency' && !formData.agency_id) {
    errors.agency_id = 'Please select an agency';
  }
  if (ownerType === 'private' && selectedPrivateOwners.length === 0) {
    errors.private_owners = 'Please select at least one private owner';
  }
  
  return errors;
};
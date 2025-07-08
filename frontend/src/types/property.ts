export interface Property {
  id: number;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  tenants: Tenant[];
  agency?: Agency;
  private_owners: PrivateOwner[];
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
  agency_id: null,
});

export const propertyToFormData = (property: Property): PropertyFormData => ({
  unit_number: property.unit_number || '',
  street_number: property.street_number,
  street_name: property.street_name,
  suburb: property.suburb,
  state: property.state,
  postcode: property.postcode,
  agency_id: property.agency?.id || null,
});
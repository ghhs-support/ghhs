import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import { 
  PropertyAddressForm, 
  OwnerTypeToggle, 
  AgencySelectionCard, 
  PrivateOwnerSelectionCard, 
  TenantManagementCard
} from '.';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { Agency, PrivateOwner, Tenant } from '../../types/property';

interface CreatePropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePropertyForm: React.FC<CreatePropertyFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { authenticatedGet, authenticatedPost, authenticatedPatch } = useAuthenticatedApi();
  
  const [formData, setFormData] = useState({
    unit_number: '',
    street_number: '',
    street_name: '',
    suburb: '',
    state: '',
    postcode: '',
    country: '',
    latitude: '',
    longitude: '',
    agency_id: null as number | null,
  });
  const [ownerType, setOwnerType] = useState<'agency' | 'private'>('agency');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  
  // Data for dropdowns
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [privateOwners, setPrivateOwners] = useState<PrivateOwner[]>([]);
  const [selectedPrivateOwnerIds, setSelectedPrivateOwnerIds] = useState<number[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAgencies();
      loadPrivateOwners();
    }
  }, [isOpen]);

  const loadAgencies = async () => {
    try {
      const response = await authenticatedGet('/properties/agencies/');
      setAgencies(response);
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const loadPrivateOwners = async () => {
    try {
      const response = await authenticatedGet('/properties/private-owners/');
      setPrivateOwners(response);
    } catch (error) {
      console.error('Error loading private owners:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.street_number.trim()) {
      newErrors.street_number = 'Street number is required';
    }
    if (!formData.street_name.trim()) {
      newErrors.street_name = 'Street name is required';
    }
    if (!formData.suburb.trim()) {
      newErrors.suburb = 'Suburb is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    }
    
    // Validate owner type selection
    if (ownerType === 'agency' && !formData.agency_id) {
      newErrors.agency_id = 'Please select an agency';
    }
    if (ownerType === 'private' && selectedPrivateOwnerIds.length === 0) {
      newErrors.private_owners = 'Please select at least one private owner';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setFormLoading(true);
      
      // Check if we're trying to create a private property
      if (ownerType === 'private') {
        toast.error('Creating properties with private owners is not yet supported. Please select an agency.');
        setFormLoading(false);
        return;
      }
      
      // Prepare data for backend (direct fields, not wrapped in 'data')
      const propertyData = {
        unit_number: formData.unit_number || null,
        street_number: formData.street_number,
        street_name: formData.street_name,
        suburb: formData.suburb,
        state: formData.state,
        postcode: formData.postcode,
        country: formData.country || '',
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        agency_id: formData.agency_id,
      };
      
      console.log('Sending data to backend:', propertyData);
      console.log('Individual fields:');
      console.log('- street_number:', `"${propertyData.street_number}"`);
      console.log('- street_name:', `"${propertyData.street_name}"`);
      console.log('- suburb:', `"${propertyData.suburb}"`);
      console.log('- state:', `"${propertyData.state}"`);
      console.log('- postcode:', `"${propertyData.postcode}"`);
      console.log('- agency_id:', propertyData.agency_id);
      
      // Make sure agency_id is a number, not null
      const dataToSend = { ...propertyData };
      if (dataToSend.agency_id === null) {
        const { agency_id, ...dataWithoutAgencyId } = dataToSend;
        Object.assign(dataToSend, dataWithoutAgencyId);
      }
      
      // Step 1: Create the property  
      const createdProperty = await authenticatedPost('/properties/create/', { data: dataToSend });
      
      // Step 2: If there are tenants, add them to the property
      if (tenants.length > 0) {
        const updateData = {
          data: {
            ...propertyData,
            tenants: tenants.map(tenant => ({
              id: tenant.id,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
              phone: tenant.phone,
              email: tenant.email || ''
            }))
          }
        };
        
        console.log('Adding tenants to property:', updateData);
        
        // Update the property with tenants
        await authenticatedPatch(`/properties/${createdProperty.id}/update/`, updateData);
      }
      
      toast.success(`Property created successfully${tenants.length > 0 ? ` with ${tenants.length} tenant${tenants.length > 1 ? 's' : ''}` : ''}!`);
      onClose();
      onSuccess();
      
      // Reset form
      setFormData({
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
      setSelectedPrivateOwnerIds([]);
      setTenants([]);
      setOwnerType('agency');
      setFormErrors({});
      
    } catch (error: any) {
      console.error('Error creating property:', error);
      console.error('Error response:', error.response?.data); // Add this line
      
      // Handle API errors
      if (error.response?.data) {
        if (typeof error.response.data === 'object' && error.response.data.detail) {
          toast.error(error.response.data.detail);
        } else if (typeof error.response.data === 'object') {
          console.error('Validation errors:', error.response.data); // Add this line
          setFormErrors(error.response.data);
        } else {
          toast.error('Failed to create property');
        }
      } else {
        toast.error('Failed to create property');
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header onClose={onClose}>Create Property</Modal.Header>
      <Modal.Body>
        <form id="create-property-form" onSubmit={handleSubmit} className="space-y-6">
          <PropertyAddressForm 
            formData={formData} 
            onChange={handleChange} 
            errors={formErrors}
          />
          
          <OwnerTypeToggle
            ownerType={ownerType}
            onChange={setOwnerType}
            disabled={formLoading}
          />
          
          {/* Agency Selection */}
          {ownerType === 'agency' && (
            <AgencySelectionCard
              agencies={agencies}
              selectedAgencyId={formData.agency_id}
              onAgencySelect={(agencyId) => setFormData(prev => ({ ...prev, agency_id: agencyId }))}
              error={formErrors.agency_id}
              disabled={formLoading}
            />
          )}
          
          {/* Private Owner Selection */}
          {ownerType === 'private' && (
            <div className="space-y-3">
              <PrivateOwnerSelectionCard
                privateOwners={privateOwners}
                selectedOwnerIds={selectedPrivateOwnerIds}
                onOwnersChange={setSelectedPrivateOwnerIds}
                error={formErrors.private_owners}
                disabled={formLoading}
              />
            </div>
          )}
          
          {/* Tenant Management */}
          <TenantManagementCard
            tenants={tenants}
            onTenantsChange={setTenants}
            disabled={formLoading}
            loading={formLoading}
          />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <button
            type="submit"
            form="create-property-form"
            disabled={formLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700 dark:text-white"
          >
            {formLoading ? 'Creating...' : 'Create Property'}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePropertyForm;


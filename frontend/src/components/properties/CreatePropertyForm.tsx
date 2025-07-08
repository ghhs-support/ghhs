import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import { 
  PropertyAddressForm, 
  OwnerTypeToggle, 
  AgencySelectionCard, 
  PrivateOwnerSelectionCard, 
  TenantDisplayCard 
} from '.';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { Agency, PrivateOwner, Tenant } from '../../types/property';

interface CreatePropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePropertyForm: React.FC<CreatePropertyFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const { authenticatedGet, authenticatedPost } = useAuthenticatedApi();
  
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
      let data: any = { ...formData };
      
      // Clear all owner data first, then set based on toggle position
      data.agency_id = null;
      data.private_owner_ids = [];
      
      // Set the correct owner type based on toggle
      if (ownerType === 'agency') {
        data.agency_id = formData.agency_id;
        data.private_owner_ids = [];
      } else if (ownerType === 'private') {
        data.agency_id = null;
        data.private_owner_ids = selectedPrivateOwnerIds;
      }
      
      // Add tenant data
      data.tenants = tenants.map(tenant => ({
        id: tenant.id,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        phone: tenant.phone,
        email: tenant.email || ''
      }));
      
      console.log('Sending data to backend:', data);
      
      // For now, just simulate success - replace with actual API call
      // const response = await authenticatedPost('/properties/properties/', { data });
      
      setTimeout(() => {
        toast.success('Property created successfully!');
        setFormLoading(false);
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
      }, 1000);
    } catch (error: any) {
      console.error('Error creating property:', error);
      if (error.data) {
        setFormErrors(error.data);
      }
      toast.error('Failed to create property');
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
            <PrivateOwnerSelectionCard
              privateOwners={privateOwners}
              selectedOwnerIds={selectedPrivateOwnerIds}
              onOwnersChange={setSelectedPrivateOwnerIds}
              error={formErrors.private_owners}
              disabled={formLoading}
            />
          )}
          
          {/* Tenant Display */}
          <TenantDisplayCard
            tenants={tenants}
            onTenantsChange={setTenants}
            allowAdd={false}
            allowRemove={false}
            disabled={formLoading}
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


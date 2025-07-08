import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Label from '../../components/form/Label';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import OwnerTypeToggle from '../../components/common/OwnerTypeToggle';
import AddressForm from '../../components/common/AddressForm';
import toast from 'react-hot-toast';
import { AgencySelectionCard, PrivateOwnerSelectionCard, TenantManagementCard } from '../forms/property';
import { Property, Tenant, PropertyFormData, Agency, PrivateOwner } from '../../types/property';

interface EditPropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSuccess?: () => void;
  onTenantsChange?: (updatedTenants: Tenant[]) => void;
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
}

export default function EditPropertyForm({ isOpen, onClose, property, onSuccess, onTenantsChange }: EditPropertyFormProps) {
  const { authenticatedGet, authenticatedPatch } = useAuthenticatedApi();
  
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [privateOwners, setPrivateOwners] = useState<PrivateOwner[]>([]);
  
  // Form states
  const [formData, setFormData] = useState<PropertyFormData>({
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  // Owner type and private owners
  const [ownerType, setOwnerType] = useState<'agency' | 'private'>('agency');
  const [selectedPrivateOwners, setSelectedPrivateOwners] = useState<{ value: string; label: string }[]>([]);
  const [tempSelectedOwner, setTempSelectedOwner] = useState<{ value: string; label: string } | null>(null);
  
  // Store selections when switching owner types (for draft mode)
  const [draftAgencyId, setDraftAgencyId] = useState<number | null>(null);
  const [draftPrivateOwners, setDraftPrivateOwners] = useState<{ value: string; label: string }[]>([]);

  // Tenant management state - local state for modal only
  const [localTenants, setLocalTenants] = useState<Tenant[]>([]);
  const [updateSuccessful, setUpdateSuccessful] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && property) {
      loadAgencies();
      loadPrivateOwners();
      resetForm();
    }
  }, [isOpen, property]);

  useEffect(() => {
    if (!isOpen) {
      // Show toast after modal is fully closed if update was successful
      if (updateSuccessful) {
        setTimeout(() => {
          toast.success('Property updated successfully!');
          setUpdateSuccessful(false);
        }, 100);
      }
    }
  }, [isOpen, updateSuccessful]);

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

  // Form handlers
  const resetForm = () => {
    if (property) {
      setFormData({
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
      
      // Determine owner type and set up the form accordingly
      if (property.agency) {
        setOwnerType('agency');
        setSelectedPrivateOwners([]);
        setTempSelectedOwner(null);
        // Reset draft selections
        setDraftAgencyId(property.agency.id);
        setDraftPrivateOwners([]);
      } else if (property.private_owners.length > 0) {
        setOwnerType('private');
        const privateOwnersList = property.private_owners.map(owner => ({
          value: owner.id.toString(),
          label: `${owner.first_name} ${owner.last_name}`
        }));
        setSelectedPrivateOwners(privateOwnersList);
        setTempSelectedOwner(null);
        // Reset draft selections
        setDraftAgencyId(null);
        setDraftPrivateOwners(privateOwnersList);
      } else {
        // Default to agency if no owner is set
        setOwnerType('agency');
        setSelectedPrivateOwners([]);
        setTempSelectedOwner(null);
        // Reset draft selections
        setDraftAgencyId(null);
        setDraftPrivateOwners([]);
      }
      
      // Initialize local tenants with current property tenants
      setLocalTenants(property.tenants);
    }
    setFormErrors({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleOwnerTypeChange = (newOwnerType: 'agency' | 'private') => {
    // Store current selections before switching
    if (ownerType === 'agency' && formData.agency_id) {
      setDraftAgencyId(formData.agency_id);
    }
    if (ownerType === 'private' && selectedPrivateOwners.length > 0) {
      setDraftPrivateOwners([...selectedPrivateOwners]);
    }
    
    setOwnerType(newOwnerType);
    
    // Restore previous selections for the new type
    if (newOwnerType === 'agency') {
      // Switching to agency - restore agency selection if available
      const agencyToRestore = draftAgencyId || formData.agency_id;
      setFormData(prev => ({ ...prev, agency_id: agencyToRestore }));
      setSelectedPrivateOwners([]);
    } else {
      // Switching to private - restore private owners selection if available
      const privateOwnersToRestore = draftPrivateOwners.length > 0 ? draftPrivateOwners : selectedPrivateOwners;
      setSelectedPrivateOwners(privateOwnersToRestore);
      setFormData(prev => ({ ...prev, agency_id: null }));
    }
    
    // Clear the temp selection for the dropdown
    setTempSelectedOwner(null);
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
    if (ownerType === 'private' && selectedPrivateOwners.length === 0) {
      newErrors.private_owners = 'Please select at least one private owner';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !property) return;

    try {
      setFormLoading(true);
      let data: any = { ...formData };
      
      // Clear all owner data first, then set based on toggle position
      data.agency_id = null;
      data.private_owner_ids = [];
      
      // Set the correct owner type based on toggle
      if (ownerType === 'agency') {
        // Toggle is on agency side - set agency and ensure private owners are cleared
        data.agency_id = formData.agency_id;
        data.private_owner_ids = []; // Explicitly clear private owners
      } else if (ownerType === 'private') {
        // Toggle is on private side - set private owners and ensure agency is cleared
        data.agency_id = null; // Explicitly clear agency
        data.private_owner_ids = selectedPrivateOwners.map(po => parseInt(po.value));
      }
      
      // Add tenant data to the update
      data.tenants = localTenants.map(tenant => ({
        id: tenant.id,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        phone: tenant.phone,
        email: tenant.email || ''
      }));
      
      console.log('Sending data to backend:', data); // Debug log
      
      const response = await authenticatedPatch(`/properties/properties/${property.id}/update/`, { data });
      
      // Update parent's tenant state with the response data
      if (response.tenants && onTenantsChange) {
        onTenantsChange(response.tenants);
      }
      
      // Set update successful flag and close modal
      setUpdateSuccessful(true);
      onClose();
      // Call the success callback after modal is closed
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 100);
    } catch (error: any) {
      console.error('Error updating property:', error);
      if (error.data) {
        setFormErrors(error.data);
      }
      toast.error('Failed to update property');
    } finally {
      setFormLoading(false);
    }
  };

  const getSelectedAgencyOption = () => {
    if (!formData.agency_id) return null;
    const agency = agencies.find(a => a.id === formData.agency_id);
    if (!agency) return null;
    return {
      value: agency.id.toString(),
      label: agency.name
    };
  };

  const getCurrentOwnerDisplay = () => {
    if (!property) return 'No property loaded';
    if (ownerType === 'agency' && property.agency) {
      return property.agency.name;
    } else if (ownerType === 'private' && property.private_owners && property.private_owners.length > 0) {
      if (property.private_owners.length === 1) {
        return `${property.private_owners[0].first_name} ${property.private_owners[0].last_name}`;
      } else {
        return `${property.private_owners.length} private owners`;
      }
    }
    return 'No owner assigned';
  };

  if (!property) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header onClose={onClose}>Edit Property</Modal.Header>
      <Modal.Body>
        <form id="edit-property-form" onSubmit={handleEditProperty} className="space-y-6">
          {/* Owner Type Toggle */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Property Owner Type</Label>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Current: {getCurrentOwnerDisplay()}
              </div>
            </div>
            <OwnerTypeToggle
              ownerType={ownerType}
              onChange={handleOwnerTypeChange}
              disabled={formLoading}
            />
          </div>

          {/* Property Address Information */}
          <AddressForm 
            formData={formData} 
            onChange={handleFormChange} 
            errors={formErrors}
          />

          {/* Owner Selection */}
          {ownerType === 'agency' && (
            <AgencySelectionCard
              agencies={agencies}
              selectedAgencyId={formData.agency_id}
              onAgencySelect={(agencyId) => {
                setFormData(prev => ({ ...prev, agency_id: agencyId }));
                if (formErrors.agency_id) {
                  setFormErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.agency_id;
                    return newErrors;
                  });
                }
              }}
              error={formErrors.agency_id}
              disabled={formLoading}
            />
          )}
          
          {ownerType === 'private' && (
            <PrivateOwnerSelectionCard
              privateOwners={privateOwners}
              selectedOwnerIds={selectedPrivateOwners.map(po => parseInt(po.value))}
              onOwnersChange={(ownerIds) => {
                const newOwners = ownerIds.map(id => {
                  const owner = privateOwners.find(o => o.id === id);
                  return owner ? { value: owner.id.toString(), label: `${owner.first_name} ${owner.last_name}` } : null;
                }).filter(Boolean) as { value: string; label: string }[];
                setSelectedPrivateOwners(newOwners);
                setDraftPrivateOwners(newOwners);
              }}
              error={formErrors.private_owners}
              disabled={formLoading}
            />
          )}

          {/* Tenant Management */}
          <TenantManagementCard
            tenants={localTenants}
            onTenantsChange={setLocalTenants}
            disabled={formLoading}
            loading={formLoading}
          />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={formLoading}
          className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancel
        </Button>
        <button
          type="submit"
          form="edit-property-form"
          disabled={formLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700 dark:text-white"
        >
          {formLoading ? 'Updating...' : 'Update Property'}
        </button>
      </Modal.Footer>

    </Modal>
  );
} 
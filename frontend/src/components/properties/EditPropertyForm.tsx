import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import toast from 'react-hot-toast';
import { 
  OwnerTypeToggle, 
  PropertyAddressForm, 
  AgencySelectionCard, 
  PrivateOwnerSelectionCard, 
  TenantManagementCard 
} from '.';
import { Property, Tenant, PropertyFormData, Agency, PrivateOwner } from '../../types/property';
import DuplicateAddressModal from '../common/DuplicateAddressModal';

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
  
  const [originalAddressData, setOriginalAddressData] = useState<{
    unit_number: string;
    street_number: string;
    street_name: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
    latitude: string;
    longitude: string;
  }>({
    unit_number: '',
    street_number: '',
    street_name: '',
    suburb: '',
    state: '',
    postcode: '',
    country: '',
    latitude: '',
    longitude: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [ownerType, setOwnerType] = useState<'agency' | 'private'>('agency');
  const [selectedPrivateOwners, setSelectedPrivateOwners] = useState<{ value: string; label: string }[]>([]);
  const [tempSelectedOwner, setTempSelectedOwner] = useState<{ value: string; label: string } | null>(null);
  const [draftAgencyId, setDraftAgencyId] = useState<number | null>(null);
  const [draftPrivateOwners, setDraftPrivateOwners] = useState<{ value: string; label: string }[]>([]);
  const [localTenants, setLocalTenants] = useState<Tenant[]>([]);
  const [updateSuccessful, setUpdateSuccessful] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [existingProperty, setExistingProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (isOpen && property) {
      loadAgencies();
      loadPrivateOwners();
      resetForm();
    }
  }, [isOpen, property]);

  useEffect(() => {
    if (!isOpen) {
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

  const resetForm = () => {
    if (property) {
      const addressData = {
        unit_number: property.unit_number || '',
        street_number: property.street_number,
        street_name: property.street_name,
        suburb: property.suburb,
        state: property.state,
        postcode: property.postcode,
        country: property.country || '',
        latitude: property.latitude || '',
        longitude: property.longitude || '',
      };
      
      setFormData({
        ...addressData,
        agency_id: property.agency?.id || null,
      });
      
      setOriginalAddressData(addressData);
      
      if (property.agency) {
        setOwnerType('agency');
        setSelectedPrivateOwners([]);
        setTempSelectedOwner(null);
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
        setDraftAgencyId(null);
        setDraftPrivateOwners(privateOwnersList);
      } else {
        setOwnerType('agency');
        setSelectedPrivateOwners([]);
        setTempSelectedOwner(null);
        setDraftAgencyId(null);
        setDraftPrivateOwners([]);
      }
      
      setLocalTenants(property.tenants);
    }
    setFormErrors({});
  };

  const resetAddressToOriginal = () => {
    setFormData(prev => ({
      ...prev,
      ...originalAddressData
    }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleOwnerTypeChange = (newOwnerType: 'agency' | 'private') => {
    if (ownerType === 'agency' && formData.agency_id) {
      setDraftAgencyId(formData.agency_id);
    }
    if (ownerType === 'private' && selectedPrivateOwners.length > 0) {
      setDraftPrivateOwners([...selectedPrivateOwners]);
    }
    
    setOwnerType(newOwnerType);
    
    if (newOwnerType === 'agency') {
      const agencyToRestore = draftAgencyId || formData.agency_id;
      setFormData(prev => ({ ...prev, agency_id: agencyToRestore }));
      setSelectedPrivateOwners([]);
    } else {
      const privateOwnersToRestore = draftPrivateOwners.length > 0 ? draftPrivateOwners : selectedPrivateOwners;
      setSelectedPrivateOwners(privateOwnersToRestore);
      setFormData(prev => ({ ...prev, agency_id: null }));
    }
    
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
      
      data.agency_id = null;
      data.private_owner_ids = [];
      
      if (ownerType === 'agency') {
        data.agency_id = formData.agency_id;
        data.private_owner_ids = [];
      } else if (ownerType === 'private') {
        data.agency_id = null;
        data.private_owner_ids = selectedPrivateOwners.map(owner => parseInt(owner.value));
      }
      
      data.tenants = localTenants.map(tenant => ({
        id: tenant.id,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        phone: tenant.phone,
        email: tenant.email || ''
      }));
      
      const response = await authenticatedPatch(`/properties/${property.id}/update/`, { data });
      
      setUpdateSuccessful(true);
      
      if (onTenantsChange) {
        onTenantsChange(localTenants);
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error: any) {
      if (error.message?.includes('409') && error.data?.duplicate) {
        setExistingProperty(error.data.existing_property);
        setShowDuplicateModal(true);
        setFormLoading(false);
        return;
      }
      
      if (error.data) {
        if (typeof error.data === 'object' && error.data.detail) {
          toast.error(error.data.detail);
        } else if (typeof error.data === 'object') {
          setFormErrors(error.data);
        } else {
          toast.error('Failed to update property');
        }
      } else {
        toast.error('Failed to update property');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDuplicateModalClose = () => {
    setShowDuplicateModal(false);
    setExistingProperty(null);
    resetAddressToOriginal();
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
    if (!property) return 'Currently: No property loaded';
    
    if (property.agency) {
      return `Currently: ${property.agency.name} (Agency)`;
    } else if (property.private_owners && property.private_owners.length > 0) {
      const ownerNames = property.private_owners.map(owner => `${owner.first_name} ${owner.last_name}`);
      return `Currently: ${ownerNames.join(', ')} (Private Owner${property.private_owners.length > 1 ? 's' : ''})`;
    }
    return 'Currently: No owner assigned';
  };

  if (!property) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <Modal.Header onClose={onClose}>Edit Property</Modal.Header>
        <Modal.Body>
          <form id="edit-property-form" onSubmit={handleEditProperty} className="space-y-6">
            <PropertyAddressForm 
              formData={formData} 
              onChange={handleFormChange} 
              errors={formErrors}
            />
            
            <OwnerTypeToggle
              ownerType={ownerType}
              onChange={handleOwnerTypeChange}
              disabled={formLoading}
            />
            
            <div className="text-sm text-gray-600 dark:text-gray-400 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              {getCurrentOwnerDisplay()}
            </div>
            
            {ownerType === 'agency' && (
              <AgencySelectionCard
                agencies={agencies}
                selectedAgencyId={formData.agency_id}
                onAgencySelect={(agencyId) => setFormData(prev => ({ ...prev, agency_id: agencyId }))}
                error={formErrors.agency_id}
                disabled={formLoading}
              />
            )}
            
            {ownerType === 'private' && (
              <PrivateOwnerSelectionCard
                privateOwners={privateOwners}
                selectedOwnerIds={selectedPrivateOwners.map(owner => parseInt(owner.value))}
                onOwnersChange={(ownerIds) => {
                  const ownerOptions = ownerIds.map(id => {
                    const owner = privateOwners.find(o => o.id === id);
                    return owner ? {
                      value: owner.id.toString(),
                      label: `${owner.first_name} ${owner.last_name}`
                    } : null;
                  }).filter(Boolean) as { value: string; label: string }[];
                  setSelectedPrivateOwners(ownerOptions);
                }}
                error={formErrors.private_owners}
                disabled={formLoading}
              />
            )}
            
            <TenantManagementCard
              tenants={localTenants}
              onTenantsChange={setLocalTenants}
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
              form="edit-property-form"
              disabled={formLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-blue-800"
            >
              {formLoading ? 'Updating...' : 'Update Property'}
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {existingProperty && (
        <DuplicateAddressModal
          isOpen={showDuplicateModal}
          onClose={handleDuplicateModalClose}
          existingProperty={existingProperty}
          newAddress={{
            unit_number: formData.unit_number,
            street_number: formData.street_number,
            street_name: formData.street_name,
            suburb: formData.suburb,
            state: formData.state,
            postcode: formData.postcode
          }}
        />
      )}
    </>
  );
} 
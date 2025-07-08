import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import Label from '../../components/form/Label';
import InputField from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import toast from 'react-hot-toast';
import { BuildingOfficeIcon, UserIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import InfoCard from '../common/InfoCard';
import { Property, Tenant, PropertyFormData, Agency, PrivateOwner, PropertyManager } from '../../types/property';

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
  const [editingTenant, setEditingTenant] = useState<number | null>(null);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [showDeleteOwnerModal, setShowDeleteOwnerModal] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<{ value: string; label: string } | null>(null);
  const [updateSuccessful, setUpdateSuccessful] = useState(false);
  const [newTenant, setNewTenant] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });
  const [editingTenantData, setEditingTenantData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });
  const [tenantErrors, setTenantErrors] = useState<Record<string, string>>({});

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
      // Only reset delete modals if they're not currently showing
      if (!showDeleteTenantModal) {
        setTenantToDelete(null);
      }
      if (!showDeleteOwnerModal) {
        setOwnerToDelete(null);
      }
      setEditingTenant(null);
      setEditingTenantData({
        first_name: '',
        last_name: '',
        phone: '',
        email: ''
      });
      setTenantErrors({});
      
      // Show toast after modal is fully closed if update was successful
      if (updateSuccessful) {
        setTimeout(() => {
          toast.success('Property updated successfully!');
          setUpdateSuccessful(false);
        }, 100);
      }
    }
  }, [isOpen, showDeleteTenantModal, showDeleteOwnerModal, updateSuccessful]);

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

  const handleFormChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Update draft agency selection when agency changes
    if (field === 'agency_id') {
      setDraftAgencyId(value);
    }
    
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
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

  // Tenant management functions
  const resetTenantForm = () => {
    setNewTenant({
      first_name: '',
      last_name: '',
      phone: '',
      email: ''
    });
    setTenantErrors({});
  };

  const validateTenant = (tenantData: any): boolean => {
    const errors: Record<string, string> = {};
    
    if (!tenantData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    if (!tenantData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    if (!tenantData.phone.trim()) {
      errors.phone = 'Phone is required';
    }
    
    setTenantErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTenant(newTenant) || !property) return;

    // Create a temporary tenant object for local state
    const tempTenant: Tenant = {
      id: Date.now(), // Temporary ID for local state
      first_name: newTenant.first_name,
      last_name: newTenant.last_name,
      phone: newTenant.phone,
      email: newTenant.email || ''
    };

    // Add to local state
    setLocalTenants(prev => [...prev, tempTenant]);
    setShowAddTenant(false);
    resetTenantForm();
  };

  const startEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant.id);
    setEditingTenantData({
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      phone: tenant.phone,
      email: tenant.email || ''
    });
    setTenantErrors({});
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTenant(editingTenantData) || !property || !editingTenant) return;

    try {
      setFormLoading(true);
      const updatedTenant: Tenant = {
        ...localTenants.find(t => t.id === editingTenant)!, // Find the tenant to update
        first_name: editingTenantData.first_name,
        last_name: editingTenantData.last_name,
        phone: editingTenantData.phone,
        email: editingTenantData.email || ''
      };

      // Update local state
      setLocalTenants(prev => prev.map(t => t.id === editingTenant ? updatedTenant : t));
      
      // Add tenant data to the update
      const data = {
        tenants: localTenants.map(tenant => ({
          id: tenant.id,
          first_name: tenant.first_name,
          last_name: tenant.last_name,
          phone: tenant.phone,
          email: tenant.email || ''
        }))
      };
      
      console.log('Sending data to backend:', data); // Debug log
      
      const response = await authenticatedPatch(`/properties/properties/${property.id}/update/`, { data });
      
      // Update parent's tenant state with the response data
      if (response.tenants && onTenantsChange) {
        onTenantsChange(response.tenants);
      }
      
      // Set update successful flag and close modal
      setUpdateSuccessful(true);
      setEditingTenant(null);
      setEditingTenantData({
        first_name: '',
        last_name: '',
        phone: '',
        email: ''
      });
      setTenantErrors({});
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      if (error.data) {
        setTenantErrors(error.data);
      }
      toast.error('Failed to update tenant');
    } finally {
      setFormLoading(false);
    }
  };


  const openDeleteTenantModal = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setShowDeleteTenantModal(true);
  };

  const handleRemoveTenant = async () => {
    if (!property || !tenantToDelete) return;

    // Remove tenant from local state
    setLocalTenants(prev => prev.filter(t => t.id !== tenantToDelete.id));
    
    setShowDeleteTenantModal(false);
    setTenantToDelete(null);
  };

  const openDeleteOwnerModal = (owner: { value: string; label: string }) => {
    setOwnerToDelete(owner);
    setShowDeleteOwnerModal(true);
  };

  const handleRemoveOwner = () => {
    if (!ownerToDelete) return;

    // Remove owner from local state
    const updatedOwners = selectedPrivateOwners.filter(po => po.value !== ownerToDelete.value);
    setSelectedPrivateOwners(updatedOwners);
    setDraftPrivateOwners(updatedOwners);
    
    setShowDeleteOwnerModal(false);
    setOwnerToDelete(null);
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Agency</span>
              </div>
              <button
                type="button"
                onClick={() => handleOwnerTypeChange(ownerType === 'agency' ? 'private' : 'agency')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  ownerType === 'private' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    ownerType === 'private' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Private Owner</span>
              </div>
            </div>
          </div>

          {/* Property Address Information */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <Label className="text-base font-medium mb-3 text-gray-900 dark:text-gray-100">Property Address</Label>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="edit_unit_number" className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit Number</Label>
                <InputField
                  id="edit_unit_number"
                  name="edit_unit_number"
                  value={formData.unit_number}
                  onChange={(e) => handleFormChange('unit_number', e.target.value)}
                  placeholder="e.g., 1A"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit_street_number" className="text-sm font-medium text-gray-700 dark:text-gray-300">Street Number *</Label>
                <InputField
                  id="edit_street_number"
                  name="edit_street_number"
                  value={formData.street_number}
                  onChange={(e) => handleFormChange('street_number', e.target.value)}
                  placeholder="e.g., 123"
                  error={!!formErrors.street_number}
                  className="mt-1"
                />
                {formErrors.street_number && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.street_number}</p>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="edit_street_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Street Name *</Label>
              <InputField
                id="edit_street_name"
                name="edit_street_name"
                value={formData.street_name}
                onChange={(e) => handleFormChange('street_name', e.target.value)}
                placeholder="e.g., Main Street"
                error={!!formErrors.street_name}
                className="mt-1"
              />
              {formErrors.street_name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.street_name}</p>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_suburb" className="text-sm font-medium text-gray-700 dark:text-gray-300">Suburb *</Label>
                <InputField
                  id="edit_suburb"
                  name="edit_suburb"
                  value={formData.suburb}
                  onChange={(e) => handleFormChange('suburb', e.target.value)}
                  placeholder="e.g., Sydney"
                  error={!!formErrors.suburb}
                  className="mt-1"
                />
                {formErrors.suburb && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.suburb}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit_state" className="text-sm font-medium text-gray-700 dark:text-gray-300">State *</Label>
                <InputField
                  id="edit_state"
                  name="edit_state"
                  value={formData.state}
                  onChange={(e) => handleFormChange('state', e.target.value)}
                  placeholder="e.g., NSW"
                  error={!!formErrors.state}
                  className="mt-1"
                />
                {formErrors.state && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.state}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit_postcode" className="text-sm font-medium text-gray-700 dark:text-gray-300">Postcode *</Label>
                <InputField
                  id="edit_postcode"
                  name="edit_postcode"
                  value={formData.postcode}
                  onChange={(e) => handleFormChange('postcode', e.target.value)}
                  placeholder="e.g., 2000"
                  error={!!formErrors.postcode}
                  className="mt-1"
                />
                {formErrors.postcode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.postcode}</p>
                )}
              </div>
            </div>
          </div>

          {/* Owner Selection */}
          {ownerType === 'agency' && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/40">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-medium text-blue-800 dark:text-blue-200">Agency Selection</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/agencies', '_blank')}
                  className="text-xs"
                >
                  Manage Agencies
                </Button>
              </div>
              <SearchableDropdown
                value={getSelectedAgencyOption()}
                onChange={(option) => handleFormChange('agency_id', option ? parseInt(option.value) : null)}
                onSearch={async (query) => {
                  const filtered = agencies.filter(agency => 
                    agency.name.toLowerCase().includes(query.toLowerCase())
                  );
                  return filtered.map(agency => ({
                    value: agency.id.toString(),
                    label: agency.name
                  }));
                }}
                placeholder="Search agencies..."
                showApplyButton={false}
                showClearButton={true}
              />
              {formErrors.agency_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.agency_id}</p>
              )}
              
              {/* Property Managers Display */}
              {formData.agency_id && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Property Managers</Label>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                      {(() => {
                        const selectedAgency = agencies.find(a => a.id === formData.agency_id);
                        return selectedAgency?.property_managers?.length || 0;
                      })()} {(() => {
                        const selectedAgency = agencies.find(a => a.id === formData.agency_id);
                        return (selectedAgency?.property_managers?.length || 0) === 1 ? 'manager' : 'managers';
                      })()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const selectedAgency = agencies.find(a => a.id === formData.agency_id);
                      const managers = selectedAgency?.property_managers || [];
                      return managers.map((manager: PropertyManager) => (
                        <InfoCard
                          key={manager.id}
                          title={`${manager.first_name} ${manager.last_name}`}
                          phone={manager.phone}
                          email={manager.email}
                          notes={manager.notes}
                          color="blue"
                        />
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {ownerType === 'private' && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/40">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-medium text-green-800 dark:text-green-200">Private Owner Selection</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/private-owners', '_blank')}
                  className="text-xs"
                >
                  Manage Private Owners
                </Button>
              </div>
              
              {/* Add Private Owner */}
              <div className="mb-4">
                <SearchableDropdown
                  value={tempSelectedOwner}
                  onChange={(option) => {
                    setTempSelectedOwner(option);
                  }}
                  onSearch={async (query) => {
                    const filtered = privateOwners.filter(owner =>
                      `${owner.first_name} ${owner.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
                      owner.email.toLowerCase().includes(query.toLowerCase()) ||
                      owner.phone.includes(query)
                    );
                    return filtered.map(owner => ({
                      value: owner.id.toString(),
                      label: `${owner.first_name} ${owner.last_name}`,
                      description: `${owner.email} • ${owner.phone}`
                    }));
                  }}
                  placeholder="Search private owners..."
                  showApplyButton={false}
                  showClearButton={true}
                />
                
                {/* Add/Cancel buttons */}
                {tempSelectedOwner && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (tempSelectedOwner && !selectedPrivateOwners.find(po => po.value === tempSelectedOwner.value)) {
                          const updatedOwners = [...selectedPrivateOwners, tempSelectedOwner];
                          setSelectedPrivateOwners(updatedOwners);
                          setDraftPrivateOwners(updatedOwners);
                        }
                        setTempSelectedOwner(null);
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <PlusIcon className="w-3 h-3" />
                      Add Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempSelectedOwner(null)}
                      className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              {/* Selected Private Owners Display */}
              {formErrors.private_owners && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.private_owners}</p>
              )}
              {selectedPrivateOwners.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                      Selected Owners
                    </Label>
                    <span className="text-sm text-green-700 dark:text-green-300 font-semibold">
                      {selectedPrivateOwners.length} {selectedPrivateOwners.length === 1 ? 'owner' : 'owners'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedPrivateOwners.map((selectedOwner) => {
                      const owner = privateOwners.find(o => o.id.toString() === selectedOwner.value);
                      if (!owner) return null;
                      
                      return (
                        <InfoCard
                          key={owner.id}
                          icon={<UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
                          title={`${owner.first_name} ${owner.last_name}`}
                          subtitle="Private Owner"
                          phone={owner.phone}
                          email={owner.email}
                          notes={owner.notes}
                          color="green"
                          actions={[
                            {
                              icon: <TrashIcon className="w-4 h-4" />,
                              onClick: () => openDeleteOwnerModal(selectedOwner),
                              title: 'Remove owner',
                              className: 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20',
                            },
                          ]}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tenant Management */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/40">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-base font-medium text-purple-800 dark:text-purple-200">Property Tenants</Label>
              <button
                type="button"
                onClick={() => setShowAddTenant(true)}
                className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                <PlusIcon className="w-3 h-3" />
                Add Tenant
              </button>
            </div>
            <div className="flex justify-end mb-2">
              <span className="text-sm text-purple-700 dark:text-purple-300 font-semibold">
                {localTenants.length} {localTenants.length === 1 ? 'tenant' : 'tenants'}
              </span>
            </div>
            
            <div className="space-y-2">
              {/* Add Tenant Form */}
              {showAddTenant && (
                <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">First Name *</Label>
                        <InputField
                          name="first_name"
                          value={newTenant.first_name}
                          onChange={(e) => setNewTenant(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="First name"
                          error={!!tenantErrors.first_name}
                          className="mt-1 text-sm"
                        />
                        {tenantErrors.first_name && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.first_name}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Last Name *</Label>
                        <InputField
                          name="last_name"
                          value={newTenant.last_name}
                          onChange={(e) => setNewTenant(prev => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Last name"
                          error={!!tenantErrors.last_name}
                          className="mt-1 text-sm"
                        />
                        {tenantErrors.last_name && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.last_name}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Phone *</Label>
                      <InputField
                        name="phone"
                        value={newTenant.phone}
                        onChange={(e) => setNewTenant(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                        error={!!tenantErrors.phone}
                        className="mt-1 text-sm"
                      />
                      {tenantErrors.phone && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email</Label>
                      <InputField
                        name="email"
                        value={newTenant.email}
                        onChange={(e) => setNewTenant(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email (optional)"
                        type="email"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddTenant}
                        disabled={formLoading}
                        className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <PlusIcon className="w-3 h-3" />
                        {formLoading ? 'Adding...' : 'Add Tenant'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddTenant(false);
                          resetTenantForm();
                        }}
                        disabled={formLoading}
                        className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Tenant Form */}
              {editingTenant && (
                <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">First Name *</Label>
                        <InputField
                          name="first_name"
                          value={editingTenantData.first_name}
                          onChange={(e) => setEditingTenantData(prev => ({ ...prev, first_name: e.target.value }))}
                          placeholder="First name"
                          error={!!tenantErrors.first_name}
                          className="mt-1 text-sm"
                        />
                        {tenantErrors.first_name && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.first_name}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Last Name *</Label>
                        <InputField
                          name="last_name"
                          value={editingTenantData.last_name}
                          onChange={(e) => setEditingTenantData(prev => ({ ...prev, last_name: e.target.value }))}
                          placeholder="Last name"
                          error={!!tenantErrors.last_name}
                          className="mt-1 text-sm"
                        />
                        {tenantErrors.last_name && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.last_name}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Phone *</Label>
                      <InputField
                        name="phone"
                        value={editingTenantData.phone}
                        onChange={(e) => setEditingTenantData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                        error={!!tenantErrors.phone}
                        className="mt-1 text-sm"
                      />
                      {tenantErrors.phone && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Email</Label>
                      <InputField
                        name="email"
                        value={editingTenantData.email}
                        onChange={(e) => setEditingTenantData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Email (optional)"
                        type="email"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleEditTenant}
                        disabled={formLoading}
                        className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <PencilIcon className="w-3 h-3" />
                        {formLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTenant(null);
                          setEditingTenantData({
                            first_name: '',
                            last_name: '',
                            phone: '',
                            email: ''
                          });
                          setTenantErrors({});
                        }}
                        disabled={formLoading}
                        className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Tenants */}
              {localTenants.length === 0 && !showAddTenant && !editingTenant ? (
                <div className="text-gray-500 dark:text-gray-300 text-sm py-4 text-center">
                  No tenants assigned to this property
                </div>
              ) : (
                <div className="space-y-2">
                  {localTenants.map((tenant) => (
                    <InfoCard
                      key={tenant.id}
                      icon={<UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                      title={`${tenant.first_name} ${tenant.last_name}`}
                      subtitle="Tenant"
                      phone={tenant.phone}
                      email={tenant.email}
                      color="purple"
                      actions={[
                        {
                          icon: <PencilIcon className="w-4 h-4" />,
                          onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            startEditTenant(tenant);
                          },
                          title: 'Edit tenant',
                          className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20',
                        },
                        {
                          icon: <TrashIcon className="w-4 h-4" />,
                          onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDeleteTenantModal(tenant);
                          },
                          title: 'Delete tenant',
                          className: 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20',
                        },
                      ]}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
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

      {/* Delete Tenant Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteTenantModal}
        onConfirm={handleRemoveTenant}
        onCancel={() => {
          setShowDeleteTenantModal(false);
          setTenantToDelete(null);
        }}
        title="Delete Tenant?"
        message={`Are you sure you want to delete the tenant ${tenantToDelete?.first_name} ${tenantToDelete?.last_name}? This action cannot be undone.`}
        confirmLabel="Delete Tenant"
        cancelLabel="Cancel"
        confirmColor="red"
        loading={formLoading}
      />

      {/* Delete Private Owner Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteOwnerModal}
        onConfirm={handleRemoveOwner}
        onCancel={() => {
          setShowDeleteOwnerModal(false);
          setOwnerToDelete(null);
        }}
        title="Remove Private Owner?"
        message={`Are you sure you want to remove ${ownerToDelete?.label} from this property? This action cannot be undone.`}
        confirmLabel="Remove Owner"
        cancelLabel="Cancel"
        confirmColor="red"
        loading={formLoading}
      />
    </Modal>
  );
} 
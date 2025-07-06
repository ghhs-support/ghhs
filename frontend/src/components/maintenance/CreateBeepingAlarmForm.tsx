import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import SearchableDropdown from '../common/SearchableDropdown';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import { useSearchService } from '../../services/search';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '../common/ConfirmModal';
import toast from 'react-hot-toast';

interface Property {
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

interface PropertyManager {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  notes?: string;
}

interface Agency {
  id: number;
  name: string;
  email: string;
  phone: string;
  property_managers: PropertyManager[];
  unit_number?: string | null;
  street_number?: string | null;
  street_name?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  longitude?: string | number | null;
  latitude?: string | number | null;
}

interface PrivateOwner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

interface CreateBeepingAlarmFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  property: number | null;
}

export default function CreateBeepingAlarmForm({ isOpen, onClose, onSuccess }: CreateBeepingAlarmFormProps) {
  const { authenticatedGet, authenticatedPost, authenticatedPatch } = useAuthenticatedApi();
  const searchService = useSearchService();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    property: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showTenantForm, setShowTenantForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [tenantFormError, setTenantFormError] = useState<string | null>(null);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  // --- Private Owner State ---
  const [showPrivateOwnerForm, setShowPrivateOwnerForm] = useState(false);
  const [editingPrivateOwner, setEditingPrivateOwner] = useState<PrivateOwner | null>(null);
  const [privateOwnerForm, setPrivateOwnerForm] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [privateOwnerFormError, setPrivateOwnerFormError] = useState<string | null>(null);
  const [privateOwnerLoading, setPrivateOwnerLoading] = useState(false);
  const [showDeletePrivateOwnerModal, setShowDeletePrivateOwnerModal] = useState(false);
  const [privateOwnerToDelete, setPrivateOwnerToDelete] = useState<PrivateOwner | null>(null);

  // --- Agency State ---
  const [showAgencyForm, setShowAgencyForm] = useState(false);
  const [agencyForm, setAgencyForm] = useState({ name: '', email: '', phone: '', unit_number: '', street_number: '', street_name: '', suburb: '', state: '', postcode: '', country: '', longitude: '', latitude: '' });
  const [agencyFormError, setAgencyFormError] = useState<string | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [showChangeAgencyForm, setShowChangeAgencyForm] = useState(false);
  const [changeAgencyLoading, setChangeAgencyLoading] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);

  // --- Property Manager State ---
  const [showPropertyManagerForm, setShowPropertyManagerForm] = useState(false);
  const [editingPropertyManager, setEditingPropertyManager] = useState<PropertyManager | null>(null);
  const [propertyManagerForm, setPropertyManagerForm] = useState({ first_name: '', last_name: '', email: '', phone: '', notes: '' });
  const [propertyManagerFormError, setPropertyManagerFormError] = useState<string | null>(null);
  const [propertyManagerLoading, setPropertyManagerLoading] = useState(false);
  const [showDeletePropertyManagerModal, setShowDeletePropertyManagerModal] = useState(false);
  const [propertyManagerToDelete, setPropertyManagerToDelete] = useState<PropertyManager | null>(null);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load properties with tenants, agency, and private owner
      try {
        const propertiesResponse = await authenticatedGet('/properties/properties/');
        setProperties(propertiesResponse);
      } catch (error) {
        console.log('Properties endpoint not available, using empty array');
        setProperties([]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // If property is being changed, update selected property
    if (field === 'property' && value) {
      const property = properties.find(p => p.id === value);
      setSelectedProperty(property || null);
    } else if (field === 'property' && !value) {
      setSelectedProperty(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.property) {
      newErrors.property = 'Property is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      setLoading(true);
      const payload = {
        ...formData,
      };
      console.log('Creating beeping alarm with payload:', payload); // Debug log
      const response = await authenticatedPost('/maintenance/beeping_alarms/', { data: payload });
      console.log('Beeping alarm created successfully:', response); // Debug log
      setFormData({
        property: null,
      });
      setSelectedProperty(null);
      setErrors({});
      onSuccess();
      onClose();
      toast.success('Beeping alarm created!');
    } catch (error: any) {
      console.error('Error creating beeping alarm:', error);
      console.error('Error response data:', error.data); // Debug log
      if (error.data) {
        setErrors(error.data);
      }
      toast.error('Failed to create beeping alarm.');
    } finally {
      setLoading(false);
    }
  };

  // Get the selected property option for the dropdown
  const getSelectedPropertyOption = () => {
    if (!formData.property) return null;
    
    const property = properties.find(p => p.id === formData.property);
    if (!property) return null;
    
    return {
      value: property.id.toString(),
      label: `${property.unit_number ? property.unit_number + '/' : ''}${property.street_number} ${property.street_name}, ${property.suburb} ${property.state} ${property.postcode}`
    };
  };

  // Inline tenant form handlers
  const openAddTenantForm = () => {
    setEditingTenant(null);
    setTenantForm({ first_name: '', last_name: '', phone: '', email: '' });
    setTenantFormError(null);
    setShowTenantForm(true);
  };

  const openEditTenantForm = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantForm({
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      phone: tenant.phone || '',
      email: tenant.email || ''
    });
    setTenantFormError(null);
    setShowTenantForm(true);
  };

  const closeTenantForm = () => {
    setShowTenantForm(false);
    setEditingTenant(null);
    setTenantForm({ first_name: '', last_name: '', phone: '', email: '' });
    setTenantFormError(null);
  };

  const handleTenantFormChange = (field: keyof typeof tenantForm, value: string) => {
    setTenantForm(prev => ({ ...prev, [field]: value }));
  };

  const refreshPropertyTenants = async () => {
    if (!selectedProperty) return;
    try {
      setTenantLoading(true);
      const property = await authenticatedGet(`/properties/properties/${selectedProperty.id}/`);
      setSelectedProperty(property);
      // Also update properties list if needed
      setProperties(prev => prev.map(p => (p.id === property.id ? property : p)));
    } catch (error) {
      // ignore
    } finally {
      setTenantLoading(false);
    }
  };

  const handleTenantFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTenantFormError(null);
    if (!tenantForm.first_name.trim() || !tenantForm.last_name.trim() || !tenantForm.phone.trim()) {
      setTenantFormError('First name, last name, and phone are required.');
      return;
    }
    try {
      setTenantLoading(true);
      if (editingTenant) {
        // Edit existing tenant - use authenticatedPatch instead of authenticatedPost with method
        console.log('Updating tenant with data:', tenantForm); // Debug log
        await authenticatedPatch(`/properties/tenants/${editingTenant.id}/`, {
          data: tenantForm
        });
        toast.success(`Tenant ${tenantForm.first_name} ${tenantForm.last_name} updated successfully!`);
      } else {
        // Add new tenant to property
        console.log('Adding tenant to property with data:', tenantForm); // Debug log
        await authenticatedPost(`/properties/properties/${selectedProperty?.id}/add_tenant/`, {
          data: tenantForm
        });
        toast.success(`Tenant ${tenantForm.first_name} ${tenantForm.last_name} added successfully!`);
      }
      await refreshPropertyTenants();
      closeTenantForm();
    } catch (error: any) {
      console.error('Tenant operation error:', error); // Debug log
      console.error('Tenant error response data:', error.data); // Debug log
      const errorMessage = error?.data?.detail || 'Failed to save tenant.';
      setTenantFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTenantLoading(false);
    }
  };

  const requestDeleteTenant = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteTenant = async () => {
    if (!selectedProperty || !tenantToDelete) return;
    setTenantLoading(true);
    try {
      await authenticatedPost(`/properties/properties/${selectedProperty.id}/remove_tenant/`, { 
        data: { tenant_id: tenantToDelete.id } 
      });
      await refreshPropertyTenants();
      toast.success('Tenant removed successfully!');
    } catch (error: any) {
      const errorMessage = error?.data?.detail || 'Failed to remove tenant.';
      toast.error(errorMessage);
    } finally {
      setTenantLoading(false);
      setShowDeleteModal(false);
      setTenantToDelete(null);
    }
  };

  const handleCancelDeleteTenant = () => {
    setShowDeleteModal(false);
    setTenantToDelete(null);
  };

  // --- Private Owner Handlers ---
  const openAddPrivateOwnerForm = () => {
    setEditingPrivateOwner(null);
    setPrivateOwnerForm({ first_name: '', last_name: '', phone: '', email: '' });
    setPrivateOwnerFormError(null);
    setShowPrivateOwnerForm(true);
  };

  const openEditPrivateOwnerForm = (owner: PrivateOwner) => {
    setEditingPrivateOwner(owner);
    setPrivateOwnerForm({
      first_name: owner.first_name,
      last_name: owner.last_name,
      phone: owner.phone || '',
      email: owner.email || ''
    });
    setPrivateOwnerFormError(null);
    setShowPrivateOwnerForm(true);
  };

  const closePrivateOwnerForm = () => {
    setShowPrivateOwnerForm(false);
    setEditingPrivateOwner(null);
    setPrivateOwnerForm({ first_name: '', last_name: '', phone: '', email: '' });
    setPrivateOwnerFormError(null);
  };

  const handlePrivateOwnerFormChange = (field: keyof typeof privateOwnerForm, value: string) => {
    setPrivateOwnerForm(prev => ({ ...prev, [field]: value }));
  };

  const refreshPropertyPrivateOwners = async () => {
    if (!selectedProperty) return;
    try {
      setPrivateOwnerLoading(true);
      const property = await authenticatedGet(`/properties/properties/${selectedProperty.id}/`);
      setSelectedProperty(property);
      setProperties(prev => prev.map(p => (p.id === property.id ? property : p)));
    } catch (error) {
      // ignore
    } finally {
      setPrivateOwnerLoading(false);
    }
  };

  const handlePrivateOwnerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrivateOwnerFormError(null);
    if (!privateOwnerForm.first_name.trim() || !privateOwnerForm.last_name.trim() || !privateOwnerForm.phone.trim()) {
      setPrivateOwnerFormError('First name, last name, and phone are required.');
      return;
    }
    try {
      setPrivateOwnerLoading(true);
      if (editingPrivateOwner) {
        await authenticatedPatch(`/properties/private_owners/${editingPrivateOwner.id}/`, {
          data: privateOwnerForm
        });
        toast.success(`Private owner ${privateOwnerForm.first_name} ${privateOwnerForm.last_name} updated successfully!`);
      } else {
        await authenticatedPost(`/properties/properties/${selectedProperty?.id}/add_private_owner/`, {
          data: privateOwnerForm
        });
        toast.success(`Private owner ${privateOwnerForm.first_name} ${privateOwnerForm.last_name} added successfully!`);
      }
      await refreshPropertyPrivateOwners();
      closePrivateOwnerForm();
    } catch (error: any) {
      const errorMessage = error?.data?.detail || 'Failed to save private owner.';
      setPrivateOwnerFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPrivateOwnerLoading(false);
    }
  };

  const requestDeletePrivateOwner = (owner: PrivateOwner) => {
    setPrivateOwnerToDelete(owner);
    setShowDeletePrivateOwnerModal(true);
  };

  const handleConfirmDeletePrivateOwner = async () => {
    if (!selectedProperty || !privateOwnerToDelete) return;
    setPrivateOwnerLoading(true);
    try {
      await authenticatedPost(`/properties/properties/${selectedProperty.id}/remove_private_owner/`, { 
        data: { private_owner_id: privateOwnerToDelete.id } 
      });
      await refreshPropertyPrivateOwners();
      toast.success('Private owner removed successfully!');
    } catch (error: any) {
      const errorMessage = error?.data?.detail || 'Failed to remove private owner.';
      toast.error(errorMessage);
    } finally {
      setPrivateOwnerLoading(false);
      setShowDeletePrivateOwnerModal(false);
      setPrivateOwnerToDelete(null);
    }
  };

  const handleCancelDeletePrivateOwner = () => {
    setShowDeletePrivateOwnerModal(false);
    setPrivateOwnerToDelete(null);
  };

  // --- Agency Handlers ---
  const openEditAgencyForm = () => {
    if (!selectedProperty?.agency) return;
    setAgencyForm({
      name: selectedProperty.agency.name || '',
      email: selectedProperty.agency.email || '',
      phone: selectedProperty.agency.phone || '',
      unit_number: selectedProperty.agency.unit_number || '',
      street_number: selectedProperty.agency.street_number || '',
      street_name: selectedProperty.agency.street_name || '',
      suburb: selectedProperty.agency.suburb || '',
      state: selectedProperty.agency.state || '',
      postcode: selectedProperty.agency.postcode || '',
      country: selectedProperty.agency.country || '',
      longitude: selectedProperty.agency.longitude !== undefined && selectedProperty.agency.longitude !== null ? String(selectedProperty.agency.longitude) : '',
      latitude: selectedProperty.agency.latitude !== undefined && selectedProperty.agency.latitude !== null ? String(selectedProperty.agency.latitude) : '',
    });
    setAgencyFormError(null);
    setShowAgencyForm(true);
  };
  const closeAgencyForm = () => {
    setShowAgencyForm(false);
    setAgencyFormError(null);
  };
  const handleAgencyFormChange = (field: keyof typeof agencyForm, value: string) => {
    setAgencyForm(prev => ({ ...prev, [field]: value }));
  };
  const handleAgencyFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAgencyFormError(null);
    if (!agencyForm.name.trim() || !agencyForm.email.trim() || !agencyForm.phone.trim()) {
      setAgencyFormError('Name, email, and phone are required.');
      return;
    }
    try {
      setAgencyLoading(true);
      
      // Prepare data, converting empty strings to null for decimal fields
      const dataToSend = {
        ...agencyForm,
        longitude: agencyForm.longitude.trim() === '' ? null : agencyForm.longitude,
        latitude: agencyForm.latitude.trim() === '' ? null : agencyForm.latitude,
      };
      
      await authenticatedPatch(`/properties/agencies/${selectedProperty?.agency?.id}/`, { data: dataToSend });
      toast.success('Agency updated successfully!');
      await refreshPropertyPrivateOwners(); // refresh property
      closeAgencyForm(); // Only close the agency edit form
    } catch (error: any) {
      const errorMessage = error?.data?.detail || 'Failed to update agency.';
      setAgencyFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setAgencyLoading(false);
    }
  };

  // --- Change Agency Handlers ---
  const openChangeAgencyForm = () => {
    setShowChangeAgencyForm(true);
    setSelectedAgencyId(null);
  };

  const closeChangeAgencyForm = () => {
    setShowChangeAgencyForm(false);
    setSelectedAgencyId(null);
  };

  const handleAgencySelection = (agencyId: number | null) => {
    setSelectedAgencyId(agencyId);
  };

  const handleChangeAgency = async () => {
    if (!selectedProperty) return;
    
    try {
      setChangeAgencyLoading(true);
      
      // Call API to change the property's agency
      await authenticatedPost(`/properties/properties/${selectedProperty.id}/change_agency/`, {
        data: { agency_id: selectedAgencyId }
      });
      
      // Refresh the property data
      await refreshPropertyPrivateOwners();
      
      toast.success('Agency changed successfully!');
      closeChangeAgencyForm();
    } catch (error: any) {
      const errorMessage = error?.data?.detail || 'Failed to change agency.';
      toast.error(errorMessage);
    } finally {
      setChangeAgencyLoading(false);
    }
  };

  // --- Property Manager Handlers ---
  const openAddPropertyManagerForm = () => {
    setEditingPropertyManager(null);
    setPropertyManagerForm({ first_name: '', last_name: '', email: '', phone: '', notes: '' });
    setPropertyManagerFormError(null);
    setShowPropertyManagerForm(true);
  };
  const openEditPropertyManagerForm = (pm: PropertyManager) => {
    setEditingPropertyManager(pm);
    setPropertyManagerForm({
      first_name: pm.first_name,
      last_name: pm.last_name,
      email: pm.email,
      phone: pm.phone,
      notes: pm.notes || ''
    });
    setPropertyManagerFormError(null);
    setShowPropertyManagerForm(true);
  };
  const closePropertyManagerForm = () => {
    setShowPropertyManagerForm(false);
    setEditingPropertyManager(null);
    setPropertyManagerFormError(null);
  };
  const handlePropertyManagerFormChange = (field: keyof typeof propertyManagerForm, value: string) => {
    setPropertyManagerForm(prev => ({ ...prev, [field]: value }));
  };
  const handlePropertyManagerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropertyManagerFormError(null);
    if (!propertyManagerForm.first_name.trim() || !propertyManagerForm.last_name.trim() || !propertyManagerForm.email.trim() || !propertyManagerForm.phone.trim()) {
      setPropertyManagerFormError('First name, last name, email, and phone are required.');
      return;
    }
    try {
      setPropertyManagerLoading(true);
      if (editingPropertyManager) {
        await authenticatedPatch(`/properties/property_managers/${editingPropertyManager.id}/`, { data: propertyManagerForm });
        toast.success('Property manager updated successfully!');
      } else {
        await authenticatedPost(`/properties/agencies/${selectedProperty?.agency?.id}/add_property_manager/`, { data: propertyManagerForm });
        toast.success('Property manager added successfully!');
      }
      await refreshPropertyPrivateOwners(); // refresh property
      closePropertyManagerForm();
    } catch (error: any) {
      const errorMessage = error?.data?.detail || 'Failed to save property manager.';
      setPropertyManagerFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPropertyManagerLoading(false);
    }
  };
  const requestDeletePropertyManager = (pm: PropertyManager) => {
    setPropertyManagerToDelete(pm);
    setShowDeletePropertyManagerModal(true);
  };
  const handleConfirmDeletePropertyManager = async () => {
    if (!selectedProperty?.agency || !propertyManagerToDelete) return;
    setPropertyManagerLoading(true);
    try {
      await authenticatedPost(`/properties/agencies/${selectedProperty.agency?.id}/remove_property_manager/`, { data: { manager_id: propertyManagerToDelete.id } });
      await refreshPropertyPrivateOwners();
      toast.success('Property manager removed successfully!');
    } catch (error: any) {
      const errorMessage = error?.data?.detail || 'Failed to remove property manager.';
      toast.error(errorMessage);
    } finally {
      setPropertyManagerLoading(false);
      setShowDeletePropertyManagerModal(false);
      setPropertyManagerToDelete(null);
    }
  };
  const handleCancelDeletePropertyManager = () => {
    setShowDeletePropertyManagerModal(false);
    setPropertyManagerToDelete(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header onClose={onClose}>Create Beeping Alarm</Modal.Header>
      <Modal.Body>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl custom-scrollbar">
          <form id="beeping-alarm-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div>
              <Label htmlFor="property" className="text-gray-900 dark:text-gray-100">Property *</Label>
              <SearchableDropdown
                value={getSelectedPropertyOption()}
                onChange={(option) => handleInputChange('property', option ? parseInt(option.value) : null)}
                onSearch={searchService.searchProperties}
                placeholder="Search by address..."
                loading={loading}
                showApplyButton={false}
                showClearButton={true}
              />
              {errors.property && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.property}</p>
              )}
            </div>

            {/* Property Owner Information */}
            {selectedProperty && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <Label className="text-base font-medium mb-3 text-gray-900 dark:text-gray-100">Property Owner</Label>
                {selectedProperty.agency ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-700 relative">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Agency</span>
                    <div className="text-sm text-gray-800 dark:text-gray-100">{selectedProperty.agency.name}</div>
                    <div className="text-gray-600 dark:text-gray-300">{selectedProperty.agency.email}</div>
                    <div className="text-gray-600 dark:text-gray-300">{selectedProperty.agency.phone}</div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={openEditAgencyForm}
                        title="Edit Agency"
                      >
                        <PencilIcon className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={openChangeAgencyForm}
                        title="Change Agency"
                      >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </button>
                    </div>
                    {/* Agency Edit Form */}
                    {showAgencyForm && (
                      <div className="mt-2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700 rounded p-3">
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
                            placeholder="Name"
                            value={agencyForm.name}
                            onChange={e => handleAgencyFormChange('name', e.target.value)}
                            required
                          />
                          <input
                            type="email"
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
                            placeholder="Email"
                            value={agencyForm.email}
                            onChange={e => handleAgencyFormChange('email', e.target.value)}
                            required
                          />
                          <input
                            type="text"
                            className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400"
                            placeholder="Phone"
                            value={agencyForm.phone}
                            onChange={e => handleAgencyFormChange('phone', e.target.value)}
                            required
                          />
                          {/* Add more fields as needed */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleAgencyFormSubmit()}
                              className="px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 text-xs"
                              disabled={agencyLoading}
                            >
                              Save
                            </button>
                            <button type="button" className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs" onClick={closeAgencyForm}>Cancel</button>
                          </div>
                          {agencyFormError && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{agencyFormError}</div>}
                        </div>
                      </div>
                    )}
                    {/* Change Agency Form */}
                    {showChangeAgencyForm && (
                      <div className="mt-2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700 rounded p-3">
                        <div className="flex flex-col gap-2">
                          <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">Select New Agency</Label>
                          <SearchableDropdown
                            value={null}
                            onChange={(option) => handleAgencySelection(option ? parseInt(option.value) : null)}
                            onSearch={searchService.searchAgencies}
                            placeholder="Search agencies..."
                            loading={false}
                            showApplyButton={false}
                            showClearButton={true}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleChangeAgency}
                              className="px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 text-xs"
                              disabled={changeAgencyLoading}
                            >
                              {changeAgencyLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={closeChangeAgencyForm}
                              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Property Managers */}
                    {selectedProperty.agency.property_managers && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Property Managers:</span>
                          <button
                            type="button"
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
                            onClick={openAddPropertyManagerForm}
                            disabled={propertyManagerLoading || !selectedProperty.agency}
                          >
                            <PlusIcon className="w-4 h-4" /> Add Property Manager
                          </button>
                        </div>
                        <div className="mt-1 space-y-1">
                          {selectedProperty.agency.property_managers.map(pm => (
                            editingPropertyManager && editingPropertyManager.id === pm.id && showPropertyManagerForm ? (
                              <div key={pm.id} className="flex flex-col md:flex-row flex-wrap gap-2 items-center bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 p-2">
                                <input
                                  type="text"
                                  className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                  placeholder="First Name"
                                  value={propertyManagerForm.first_name}
                                  onChange={e => handlePropertyManagerFormChange('first_name', e.target.value)}
                                  required
                                />
                                <input
                                  type="text"
                                  className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                  placeholder="Last Name"
                                  value={propertyManagerForm.last_name}
                                  onChange={e => handlePropertyManagerFormChange('last_name', e.target.value)}
                                  required
                                />
                                <input
                                  type="email"
                                  className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                  placeholder="Email"
                                  value={propertyManagerForm.email}
                                  onChange={e => handlePropertyManagerFormChange('email', e.target.value)}
                                  required
                                />
                                <input
                                  type="text"
                                  className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                  placeholder="Phone"
                                  value={propertyManagerForm.phone}
                                  onChange={e => handlePropertyManagerFormChange('phone', e.target.value)}
                                  required
                                />
                                <input
                                  type="text"
                                  className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                  placeholder="Notes (optional)"
                                  value={propertyManagerForm.notes}
                                  onChange={e => handlePropertyManagerFormChange('notes', e.target.value)}
                                />
                                <div className="flex gap-2">
                                  <button type="button" className="px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 text-xs" onClick={handlePropertyManagerFormSubmit}>Save</button>
                                  <button type="button" className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs" onClick={closePropertyManagerForm}>Cancel</button>
                                </div>
                                {propertyManagerFormError && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{propertyManagerFormError}</div>}
                              </div>
                            ) : (
                              <div key={pm.id} className="text-xs bg-white dark:bg-gray-800 rounded p-2 border border-blue-200 dark:border-blue-700 relative">
                                <div className="font-medium text-gray-800 dark:text-gray-100">{pm.first_name} {pm.last_name}</div>
                                <div className="text-gray-600 dark:text-gray-300">{pm.email}</div>
                                <div className="text-gray-600 dark:text-gray-300">{pm.phone}</div>
                                {pm.notes && <div className="text-gray-500 dark:text-gray-400 italic">{pm.notes}</div>}
                                <div className="absolute top-2 right-2 flex gap-2">
                                  <button type="button" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => openEditPropertyManagerForm(pm)} title="Edit">
                                    <PencilIcon className="w-4 h-4 text-blue-500" />
                                  </button>
                                  <button type="button" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestDeletePropertyManager(pm)} title="Delete">
                                    <TrashIcon className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            )
                          ))}
                          {/* Inline add form */}
                          {showPropertyManagerForm && !editingPropertyManager && (
                            <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 p-2">
                              <input
                                type="text"
                                className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="First Name"
                                value={propertyManagerForm.first_name}
                                onChange={e => handlePropertyManagerFormChange('first_name', e.target.value)}
                                required
                              />
                              <input
                                type="text"
                                className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="Last Name"
                                value={propertyManagerForm.last_name}
                                onChange={e => handlePropertyManagerFormChange('last_name', e.target.value)}
                                required
                              />
                              <input
                                type="email"
                                className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="Email"
                                value={propertyManagerForm.email}
                                onChange={e => handlePropertyManagerFormChange('email', e.target.value)}
                                required
                              />
                              <input
                                type="text"
                                className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="Phone"
                                value={propertyManagerForm.phone}
                                onChange={e => handlePropertyManagerFormChange('phone', e.target.value)}
                                required
                              />
                              <input
                                type="text"
                                className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="Notes (optional)"
                                value={propertyManagerForm.notes}
                                onChange={e => handlePropertyManagerFormChange('notes', e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button type="button" className="px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 text-xs" onClick={handlePropertyManagerFormSubmit}>Add</button>
                                <button type="button" className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs" onClick={closePropertyManagerForm}>Cancel</button>
                              </div>
                              {propertyManagerFormError && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{propertyManagerFormError}</div>}
                            </div>
                          )}
                          {/* Confirm Delete Modal */}
                          <ConfirmModal
                            isOpen={showDeletePropertyManagerModal}
                            onConfirm={handleConfirmDeletePropertyManager}
                            onCancel={handleCancelDeletePropertyManager}
                            title="Remove Property Manager?"
                            message={`Are you sure you want to remove ${propertyManagerToDelete?.first_name || ''} ${propertyManagerToDelete?.last_name || ''} from this agency?`}
                            confirmLabel="Remove Property Manager"
                            cancelLabel="Cancel"
                            confirmColor="red"
                            loading={propertyManagerLoading}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  selectedProperty.private_owners && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/40 rounded border border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Private Owners</span>
                        <button
                          type="button"
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-700"
                          onClick={openAddPrivateOwnerForm}
                          disabled={privateOwnerLoading || !selectedProperty}
                        >
                          <PlusIcon className="w-4 h-4" /> Add Private Owner
                        </button>
                      </div>
                      <div className="mt-2 space-y-2">
                        {selectedProperty.private_owners.length === 0 && (
                          <div className="text-gray-500 dark:text-gray-300 text-sm">No private owners</div>
                        )}
                        {selectedProperty.private_owners.map(owner => (
                          editingPrivateOwner && editingPrivateOwner.id === owner.id && showPrivateOwnerForm ? (
                            <div key={owner.id} className="flex flex-col md:flex-row flex-wrap gap-2 items-center bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700 p-2">
                              <input
                                type="text"
                                className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="First Name"
                                value={privateOwnerForm.first_name}
                                onChange={e => handlePrivateOwnerFormChange('first_name', e.target.value)}
                                required
                              />
                              <input
                                type="text"
                                className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="Last Name"
                                value={privateOwnerForm.last_name}
                                onChange={e => handlePrivateOwnerFormChange('last_name', e.target.value)}
                                required
                              />
                              <input
                                type="text"
                                className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="Phone"
                                value={privateOwnerForm.phone}
                                onChange={e => handlePrivateOwnerFormChange('phone', e.target.value)}
                                required
                              />
                              <input
                                type="email"
                                className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                placeholder="Email (optional)"
                                value={privateOwnerForm.email}
                                onChange={e => handlePrivateOwnerFormChange('email', e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button type="button" className="px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 text-xs" onClick={handlePrivateOwnerFormSubmit}>Save</button>
                                <button type="button" className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs" onClick={closePrivateOwnerForm}>Cancel</button>
                              </div>
                              {privateOwnerFormError && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{privateOwnerFormError}</div>}
                            </div>
                          ) : (
                            <div key={owner.id} className="text-sm bg-white dark:bg-gray-800 rounded p-2 border border-green-200 dark:border-green-700 relative">
                              <div className="font-medium text-gray-800 dark:text-gray-100">{owner.first_name} {owner.last_name}</div>
                              <div className="text-gray-600 dark:text-gray-300">{owner.email}</div>
                              <div className="text-gray-600 dark:text-gray-300">{owner.phone}</div>
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button type="button" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => openEditPrivateOwnerForm(owner)} title="Edit">
                                  <PencilIcon className="w-4 h-4 text-green-500" />
                                </button>
                                <button type="button" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestDeletePrivateOwner(owner)} title="Delete">
                                  <TrashIcon className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          )
                        ))}
                        {/* Inline add form */}
                        {showPrivateOwnerForm && !editingPrivateOwner && (
                          <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-700 p-2">
                            <input
                              type="text"
                              className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              placeholder="First Name"
                              value={privateOwnerForm.first_name}
                              onChange={e => handlePrivateOwnerFormChange('first_name', e.target.value)}
                              required
                            />
                            <input
                              type="text"
                              className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              placeholder="Last Name"
                              value={privateOwnerForm.last_name}
                              onChange={e => handlePrivateOwnerFormChange('last_name', e.target.value)}
                              required
                            />
                            <input
                              type="text"
                              className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              placeholder="Phone"
                              value={privateOwnerForm.phone}
                              onChange={e => handlePrivateOwnerFormChange('phone', e.target.value)}
                              required
                            />
                            <input
                              type="email"
                              className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                              placeholder="Email (optional)"
                              value={privateOwnerForm.email}
                              onChange={e => handlePrivateOwnerFormChange('email', e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button type="button" className="px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 text-xs" onClick={handlePrivateOwnerFormSubmit}>Add</button>
                              <button type="button" className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs" onClick={closePrivateOwnerForm}>Cancel</button>
                            </div>
                            {privateOwnerFormError && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{privateOwnerFormError}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Tenants for Selected Property */}
            {selectedProperty && selectedProperty.tenants && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/40">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium text-blue-800 dark:text-blue-200">Property Tenants</Label>
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-700"
                    onClick={openAddTenantForm}
                    disabled={tenantLoading || !selectedProperty}
                  >
                    <PlusIcon className="w-4 h-4" /> Add Tenant
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {selectedProperty.tenants.length === 0 && (
                    <div className="text-gray-500 dark:text-gray-300 text-sm">No tenants</div>
                  )}
                  {selectedProperty.tenants.map(tenant => (
                    editingTenant && editingTenant.id === tenant.id && showTenantForm ? (
                      <div key={tenant.id} className="flex flex-col md:flex-row flex-wrap gap-2 items-center bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2">
                        <input
                          type="text"
                          className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          placeholder="First Name"
                          value={tenantForm.first_name}
                          onChange={e => handleTenantFormChange('first_name', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          placeholder="Last Name"
                          value={tenantForm.last_name}
                          onChange={e => handleTenantFormChange('last_name', e.target.value)}
                          required
                        />
                        <input
                          type="text"
                          className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          placeholder="Phone"
                          value={tenantForm.phone}
                          onChange={e => handleTenantFormChange('phone', e.target.value)}
                          required
                        />
                        <input
                          type="email"
                          className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          placeholder="Email (optional)"
                          value={tenantForm.email}
                          onChange={e => handleTenantFormChange('email', e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button type="button" className="px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 text-xs" onClick={handleTenantFormSubmit}>Save</button>
                          <button type="button" className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs" onClick={closeTenantForm}>Cancel</button>
                        </div>
                        {tenantFormError && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{tenantFormError}</div>}
                      </div>
                    ) : (
                      <div key={tenant.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900 dark:text-gray-100">{tenant.first_name} {tenant.last_name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-300">{tenant.phone}</span>
                          {tenant.email && (
                            <span className="text-xs text-blue-400 dark:text-blue-300">{tenant.email}</span>
                          )}
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button type="button" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => openEditTenantForm(tenant)}>
                            <PencilIcon className="w-4 h-4 text-blue-500" />
                          </button>
                          <button type="button" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestDeleteTenant(tenant)}>
                            <TrashIcon className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                  {/* Inline add form */}
                  {showTenantForm && !editingTenant && (
                    <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2">
                      <input
                        type="text"
                        className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        placeholder="First Name"
                        value={tenantForm.first_name}
                        onChange={e => handleTenantFormChange('first_name', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        placeholder="Last Name"
                        value={tenantForm.last_name}
                        onChange={e => handleTenantFormChange('last_name', e.target.value)}
                        required
                      />
                      <input
                        type="text"
                        className="w-32 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        placeholder="Phone"
                        value={tenantForm.phone}
                        onChange={e => handleTenantFormChange('phone', e.target.value)}
                        required
                      />
                      <input
                        type="email"
                        className="w-40 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        placeholder="Email (optional)"
                        value={tenantForm.email}
                        onChange={e => handleTenantFormChange('email', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button type="button" className="px-3 py-1 rounded bg-brand-500 text-white hover:bg-brand-600 text-xs" onClick={handleTenantFormSubmit}>Add</button>
                        <button type="button" className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs" onClick={closeTenantForm}>Cancel</button>
                      </div>
                      {tenantFormError && <div className="text-xs text-red-600 dark:text-red-400 mt-1">{tenantFormError}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirm Delete Modals */}
            <ConfirmModal
              isOpen={showDeleteModal}
              onConfirm={handleConfirmDeleteTenant}
              onCancel={handleCancelDeleteTenant}
              title="Remove Tenant?"
              message={`Are you sure you want to remove ${tenantToDelete?.first_name || ''} ${tenantToDelete?.last_name || ''} from this property?`}
              confirmLabel="Remove Tenant"
              cancelLabel="Cancel"
              confirmColor="red"
              loading={tenantLoading}
            />
            <ConfirmModal
              isOpen={showDeletePrivateOwnerModal}
              onConfirm={handleConfirmDeletePrivateOwner}
              onCancel={handleCancelDeletePrivateOwner}
              title="Remove Private Owner?"
              message={`Are you sure you want to remove ${privateOwnerToDelete?.first_name || ''} ${privateOwnerToDelete?.last_name || ''} from this property?`}
              confirmLabel="Remove Private Owner"
              cancelLabel="Cancel"
              confirmColor="red"
              loading={privateOwnerLoading}
            />
          </form>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancel
        </Button>
        <button
          type="submit"
          form="beeping-alarm-form"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700 dark:text-white"
        >
          {loading ? 'Creating...' : 'Create Beeping Alarm'}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
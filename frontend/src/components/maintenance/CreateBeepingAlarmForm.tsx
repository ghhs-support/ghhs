import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import SearchableDropdown from '../common/SearchableDropdown';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import { useSearchService } from '../../services/search';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  private_owner?: PrivateOwner;
}

interface Agency {
  id: number;
  name: string;
  email: string;
}

interface PrivateOwner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
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
      toast.success(`Tenant ${tenantToDelete.first_name} ${tenantToDelete.last_name} removed successfully!`);
    } catch (error: any) {
      console.error('Error removing tenant:', error);
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
                {selectedProperty.agency && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-700">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Agency</span>
                    <div className="text-sm text-gray-800 dark:text-gray-100">{selectedProperty.agency.name}</div>
                    <div className="text-gray-600 dark:text-gray-300">{selectedProperty.agency.email}</div>
                  </div>
                )}
                {selectedProperty.private_owner && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/40 rounded border border-green-200 dark:border-green-700">
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">Private Owner</span>
                    <div className="text-sm text-gray-800 dark:text-gray-100">
                      {selectedProperty.private_owner.first_name} {selectedProperty.private_owner.last_name}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">{selectedProperty.private_owner.email}</div>
                  </div>
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
      {/* Confirm Delete Modal */}
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
    </Modal>
  );
}
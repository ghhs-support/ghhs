import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import Label from '../../components/form/Label';
import InputField from '../../components/form/input/InputField';
import ConfirmModal from '../../components/common/ConfirmModal';
import PropertiesTable from '../../components/properties/PropertiesTable';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';

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

interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

interface Agency {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface PrivateOwner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface PropertyFormData {
  unit_number: string;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  agency_id?: number | null;
}

export default function Properties() {
  const { authenticatedGet, authenticatedPost, authenticatedPatch, authenticatedDelete } = useAuthenticatedApi();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  
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

  // Load initial data
  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      const response = await authenticatedGet('/properties/agencies/');
      setAgencies(response);
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      unit_number: '',
      street_number: '',
      street_name: '',
      suburb: '',
      state: '',
      postcode: '',
      agency_id: null,
    });
    setFormErrors({});
  };

  const handleFormChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
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
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create property
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormLoading(true);
      await authenticatedPost('/properties/properties/create/', { data: formData });
      toast.success('Property created successfully!');
      setShowCreateModal(false);
      resetForm();
      // Refresh the table by triggering a re-render
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating property:', error);
      if (error.data) {
        setFormErrors(error.data);
      }
      toast.error('Failed to create property');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit property
  const openEditModal = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      unit_number: property.unit_number || '',
      street_number: property.street_number,
      street_name: property.street_name,
      suburb: property.suburb,
      state: property.state,
      postcode: property.postcode,
      agency_id: property.agency?.id || null,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty || !validateForm()) return;

    try {
      setFormLoading(true);
      await authenticatedPatch(`/properties/properties/${editingProperty.id}/update/`, { data: formData });
      toast.success('Property updated successfully!');
      setShowEditModal(false);
      setEditingProperty(null);
      resetForm();
      // Refresh the table by triggering a re-render
      window.location.reload();
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

  // Delete property
  const openDeleteModal = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      setFormLoading(true);
      await authenticatedDelete(`/properties/properties/${propertyToDelete.id}/delete/`);
      toast.success('Property deleted successfully!');
      setShowDeleteModal(false);
      setPropertyToDelete(null);
      // Refresh the table by triggering a re-render
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
    } finally {
      setFormLoading(false);
    }
  };

  // Get agency option for dropdown
  const getSelectedAgencyOption = () => {
    if (!formData.agency_id) return null;
    const agency = agencies.find(a => a.id === formData.agency_id);
    if (!agency) return null;
    return {
      value: agency.id.toString(),
      label: agency.name
    };
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Properties</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all properties in the system</p>
      </div>

      <div className="mb-4">
        <Button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          startIcon={<PlusIcon className="w-5 h-5" />}
        >
          Add Property
        </Button>
      </div>

      {/* Properties Table */}
      <PropertiesTable />

      {/* Create Property Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <Modal.Header onClose={() => setShowCreateModal(false)}>Add Property</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCreateProperty} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit_number">Unit Number</Label>
                <InputField
                  id="unit_number"
                  value={formData.unit_number}
                  onChange={(e) => handleFormChange('unit_number', e.target.value)}
                  placeholder="e.g., 1A"
                />
              </div>
              <div>
                <Label htmlFor="street_number">Street Number *</Label>
                <InputField
                  id="street_number"
                  value={formData.street_number}
                  onChange={(e) => handleFormChange('street_number', e.target.value)}
                  placeholder="e.g., 123"
                  error={!!formErrors.street_number}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="street_name">Street Name *</Label>
              <InputField
                id="street_name"
                value={formData.street_name}
                onChange={(e) => handleFormChange('street_name', e.target.value)}
                placeholder="e.g., Main Street"
                error={!!formErrors.street_name}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="suburb">Suburb *</Label>
                <InputField
                  id="suburb"
                  value={formData.suburb}
                  onChange={(e) => handleFormChange('suburb', e.target.value)}
                  placeholder="e.g., Sydney"
                  error={!!formErrors.suburb}
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <InputField
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleFormChange('state', e.target.value)}
                  placeholder="e.g., NSW"
                  error={!!formErrors.state}
                />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode *</Label>
                <InputField
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => handleFormChange('postcode', e.target.value)}
                  placeholder="e.g., 2000"
                  error={!!formErrors.postcode}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="agency">Agency (Optional)</Label>
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
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(false)}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleCreateProperty(fakeEvent);
            }}
            disabled={formLoading}
          >
            {formLoading ? 'Creating...' : 'Create Property'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Property Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <Modal.Header onClose={() => setShowEditModal(false)}>Edit Property</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleEditProperty} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_unit_number">Unit Number</Label>
                <InputField
                  id="edit_unit_number"
                  value={formData.unit_number}
                  onChange={(e) => handleFormChange('unit_number', e.target.value)}
                  placeholder="e.g., 1A"
                />
              </div>
              <div>
                <Label htmlFor="edit_street_number">Street Number *</Label>
                <InputField
                  id="edit_street_number"
                  value={formData.street_number}
                  onChange={(e) => handleFormChange('street_number', e.target.value)}
                  placeholder="e.g., 123"
                  error={!!formErrors.street_number}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_street_name">Street Name *</Label>
              <InputField
                id="edit_street_name"
                value={formData.street_name}
                onChange={(e) => handleFormChange('street_name', e.target.value)}
                placeholder="e.g., Main Street"
                error={!!formErrors.street_name}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit_suburb">Suburb *</Label>
                <InputField
                  id="edit_suburb"
                  value={formData.suburb}
                  onChange={(e) => handleFormChange('suburb', e.target.value)}
                  placeholder="e.g., Sydney"
                  error={!!formErrors.suburb}
                />
              </div>
              <div>
                <Label htmlFor="edit_state">State *</Label>
                <InputField
                  id="edit_state"
                  value={formData.state}
                  onChange={(e) => handleFormChange('state', e.target.value)}
                  placeholder="e.g., NSW"
                  error={!!formErrors.state}
                />
              </div>
              <div>
                <Label htmlFor="edit_postcode">Postcode *</Label>
                <InputField
                  id="edit_postcode"
                  value={formData.postcode}
                  onChange={(e) => handleFormChange('postcode', e.target.value)}
                  placeholder="e.g., 2000"
                  error={!!formErrors.postcode}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_agency">Agency (Optional)</Label>
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
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
            disabled={formLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              handleEditProperty(fakeEvent);
            }}
            disabled={formLoading}
          >
            {formLoading ? 'Updating...' : 'Update Property'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteProperty}
        onCancel={() => setShowDeleteModal(false)}
        title="Delete Property?"
        message={`Are you sure you want to delete the property at ${propertyToDelete?.street_number} ${propertyToDelete?.street_name}? This action cannot be undone.`}
        confirmLabel="Delete Property"
        cancelLabel="Cancel"
        confirmColor="red"
        loading={formLoading}
      />
    </div>
  );
} 
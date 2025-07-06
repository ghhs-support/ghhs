import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import Label from '../../components/form/Label';
import InputField from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import ConfirmModal from '../../components/common/ConfirmModal';
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

interface EditPropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSuccess: () => void;
}

export default function EditPropertyForm({ isOpen, onClose, property, onSuccess }: EditPropertyFormProps) {
  const { authenticatedGet, authenticatedPost, authenticatedPatch } = useAuthenticatedApi();
  
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
  const [selectedPrivateOwner, setSelectedPrivateOwner] = useState<{ value: string; label: string } | null>(null);

  // Tenant management state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [editingTenant, setEditingTenant] = useState<number | null>(null);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showDeleteTenantModal, setShowDeleteTenantModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
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
      if (property.agency) {
        setOwnerType('agency');
        setSelectedPrivateOwner(null);
      } else if (property.private_owners.length > 0) {
        setOwnerType('private');
        setSelectedPrivateOwner({
          value: property.private_owners[0].id.toString(),
          label: `${property.private_owners[0].first_name} ${property.private_owners[0].last_name}`
        });
      } else {
        setOwnerType('agency');
        setSelectedPrivateOwner(null);
      }
      setTenants(property.tenants);
    }
    setFormErrors({});
  };

  const handleFormChange = (field: keyof PropertyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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

  const handleEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !property) return;

    try {
      setFormLoading(true);
      let data: any = { ...formData };
      if (ownerType === 'agency') {
        data.agency_id = formData.agency_id;
        data.private_owner_id = null;
      } else if (ownerType === 'private') {
        data.agency_id = null;
        data.private_owner_id = selectedPrivateOwner ? parseInt(selectedPrivateOwner.value) : null;
      }
      await authenticatedPatch(`/properties/properties/${property.id}/update/`, { data });
      toast.success('Property updated successfully!');
      onClose();
      onSuccess();
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

  if (!property) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header onClose={onClose}>Edit Property</Modal.Header>
      <Modal.Body>
        <form id="edit-property-form" onSubmit={handleEditProperty} className="space-y-6">
          {/* Property Address Information */}
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <Label className="text-base font-medium mb-3 text-gray-900 dark:text-gray-100">Property Address</Label>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="edit_unit_number" className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit Number</Label>
                <InputField
                  id="edit_unit_number"
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
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Button from '../../components/ui/button/Button';
import { Modal } from '../../components/ui/modal';
import SearchableDropdown from '../../components/common/SearchableDropdown';
import Label from '../../components/form/Label';
import InputField from '../../components/form/input/InputField';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/ui/badge/Badge';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

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

export default function PropertyDetails() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { authenticatedGet, authenticatedPost, authenticatedPatch, authenticatedDelete } = useAuthenticatedApi();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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

  // Load property data
  useEffect(() => {
    if (propertyId) {
      loadProperty();
      loadAgencies();
    }
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const response = await authenticatedGet(`/properties/properties/${propertyId}/`);
      setProperty(response);
    } catch (error) {
      console.error('Error loading property:', error);
      toast.error('Failed to load property details');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

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
    }
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

  const openEditModal = () => {
    resetForm();
    setShowEditModal(true);
  };

  const handleEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !property) return;

    try {
      setFormLoading(true);
      await authenticatedPatch(`/properties/properties/${property.id}/update/`, { data: formData });
      toast.success('Property updated successfully!');
      setShowEditModal(false);
      loadProperty(); // Reload property data
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

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteProperty = async () => {
    if (!property) return;

    try {
      setFormLoading(true);
      await authenticatedDelete(`/properties/properties/${property.id}/delete/`);
      toast.success('Property deleted successfully!');
      navigate('/properties');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Failed to delete property');
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

  const formatAddress = (property: Property) => {
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading property details...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Property not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/properties')}
            startIcon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Back to Properties
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={openEditModal}
              startIcon={<PencilIcon className="w-4 h-4" />}
            >
              Edit Property
            </Button>
            <Button
              variant="outline"
              onClick={openDeleteModal}
              startIcon={<TrashIcon className="w-4 h-4" />}
              className="text-red-600 hover:text-red-700"
            >
              Delete Property
            </Button>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Property Details</h1>
        <p className="text-gray-600 dark:text-gray-400">{formatAddress(property)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Information */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Property Information</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPinIcon className="w-4 h-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {property.unit_number ? `Unit ${property.unit_number}, ` : ''}
                  {property.street_number} {property.street_name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {property.suburb}, {property.state} {property.postcode}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Owner */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Property Owner</h2>
          </div>
          
          {property.agency ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge size="sm" color="info">Agency</Badge>
              </div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {property.agency.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <EnvelopeIcon className="w-4 h-4" />
                {property.agency.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <PhoneIcon className="w-4 h-4" />
                {property.agency.phone}
              </div>
            </div>
          ) : property.private_owners.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge size="sm" color="warning">Private Owner</Badge>
              </div>
              {property.private_owners.map((owner, index) => (
                <div key={owner.id} className="space-y-2">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {owner.first_name} {owner.last_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <EnvelopeIcon className="w-4 h-4" />
                    {owner.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <PhoneIcon className="w-4 h-4" />
                    {owner.phone}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              <Badge size="sm" color="error">No Owner</Badge>
              <div className="mt-2">No owner assigned to this property</div>
            </div>
          )}
        </div>

        {/* Tenants */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tenants</h2>
            </div>
            <Badge size="sm" color={property.tenants.length > 0 ? "success" : "error"}>
              {property.tenants.length} {property.tenants.length === 1 ? 'Tenant' : 'Tenants'}
            </Badge>
          </div>
          
          {property.tenants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <UserIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <div>No tenants assigned to this property</div>
              <div className="text-sm">This property is currently vacant</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.tenants.map((tenant) => (
                <div key={tenant.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {tenant.first_name} {tenant.last_name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <PhoneIcon className="w-4 h-4" />
                    {tenant.phone}
                  </div>
                  {tenant.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <EnvelopeIcon className="w-4 h-4" />
                      {tenant.email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
        message={`Are you sure you want to delete the property at ${property.street_number} ${property.street_name}? This action cannot be undone.`}
        confirmLabel="Delete Property"
        cancelLabel="Cancel"
        confirmColor="red"
        loading={formLoading}
      />
    </div>
  );
} 
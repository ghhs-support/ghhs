import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Button from '../../components/ui/button/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import Badge from '../../components/ui/badge/Badge';
import EditPropertyForm from '../../components/properties/EditPropertyForm';
import toast from 'react-hot-toast';
import { 
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

export default function PropertyDetails() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { authenticatedGet, authenticatedDelete } = useAuthenticatedApi();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formLoading, setFormLoading] = useState(false);

  // Load property data
  useEffect(() => {
    if (propertyId) {
      loadProperty();
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

  const openEditModal = () => {
    setShowEditModal(true);
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

  const handleEditSuccess = () => {
    loadProperty(); // Reload property data after successful edit
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
      <EditPropertyForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        property={property}
        onSuccess={handleEditSuccess}
      />

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
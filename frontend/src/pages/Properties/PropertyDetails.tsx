import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Button from '../../components/ui/button/Button';
import ConfirmModal from '../../components/common/ConfirmModal';
import EditPropertyForm from '../../components/properties/EditPropertyForm';
import Label from '../../components/form/Label';
import toast from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon} from '@heroicons/react/24/outline';
import InfoCard from '../../components/common/InfoCard';
import { Property, Tenant, formatPropertyAddress } from '../../types/property';

export default function PropertyDetails() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { authenticatedGet, authenticatedDelete } = useAuthenticatedApi();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
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
      setTenants(response.tenants || []);
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

  const handleTenantsChange = (updatedTenants: Tenant[]) => {
    setTenants(updatedTenants);
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
        <p className="text-gray-600 dark:text-gray-400">{formatPropertyAddress(property)}</p>
      </div>

      <div className="flex flex-col gap-6">
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
        <div className={`rounded-xl border p-6 ${
          property.agency 
            ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700' 
            : property.private_owners.length > 0 
            ? 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            {property.agency ? (
              <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : property.private_owners.length > 0 ? (
              <UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <UserIcon className="w-5 h-5 text-gray-500" />
            )}
            <h2 className={`text-lg font-semibold ${
              property.agency 
                ? 'text-blue-800 dark:text-blue-200' 
                : property.private_owners.length > 0 
                ? 'text-green-800 dark:text-green-200'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              Property Owner
            </h2>
          </div>
          
          {property.agency && (
            <InfoCard
              icon={<BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              title={property.agency.name}
              subtitle="Agency"
              phone={property.agency.phone}
              email={property.agency.email}
              color="blue"
            >
              {property.agency.property_managers && property.agency.property_managers.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Property Managers</Label>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                      {property.agency.property_managers.length} {property.agency.property_managers.length === 1 ? 'manager' : 'managers'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {property.agency.property_managers.map((manager) => (
                      <InfoCard
                        key={manager.id}
                        title={`${manager.first_name} ${manager.last_name}`}
                        phone={manager.phone}
                        email={manager.email}
                        notes={manager.notes}
                        color="blue"
                      />
                    ))}
                  </div>
                </div>
              )}
            </InfoCard>
          )}
          {property.private_owners.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700 dark:text-green-300 font-semibold">Private Owner</span>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {property.private_owners.length} {property.private_owners.length === 1 ? 'Private Owner' : 'Private Owners'}
                </span>
              </div>
              {property.private_owners.map((owner) => (
                <InfoCard
                  key={owner.id}
                  icon={<UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
                  title={`${owner.first_name} ${owner.last_name}`}
                  subtitle="Private Owner"
                  phone={owner.phone}
                  email={owner.email}
                  color="green"
                />
              ))}
            </div>
          )}
        </div>

        {/* Tenants */}
        <div className="bg-purple-50 dark:bg-purple-900/40 rounded-xl border border-purple-200 dark:border-purple-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-200">Tenants</h2>
            </div>
            <span className="text-sm text-purple-700 dark:text-purple-300 font-semibold">
              {tenants.length} {tenants.length === 1 ? 'Tenant' : 'Tenants'}
            </span>
          </div>
          
          {tenants.length === 0 ? (
            <div className="text-center py-8 text-purple-600 dark:text-purple-400">
              <UserIcon className="w-12 h-12 mx-auto mb-2 text-purple-300 dark:text-purple-600" />
              <div>No tenants assigned to this property</div>
              <div className="text-sm">This property is currently vacant</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant) => (
                <InfoCard
                  key={tenant.id}
                  icon={<UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  title={`${tenant.first_name} ${tenant.last_name}`}
                  subtitle="Tenant"
                  phone={tenant.phone}
                  email={tenant.email}
                  color="purple"
                />
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
        onTenantsChange={handleTenantsChange}
        tenants={tenants}
        setTenants={setTenants}
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
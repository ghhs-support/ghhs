import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Button from '../../components/ui/button/Button';
import Switch from '../../components/form/switch/Switch';
import EditPropertyForm from '../../components/properties/EditPropertyForm';
import toast from 'react-hot-toast';
import { 
  PencilIcon, 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  MapPinIcon} from '@heroicons/react/24/outline';
import { 
  TenantDisplayCard, 
  AgencyDisplayCard, 
  PrivateOwnerDisplayCard 
} from '../../components/properties';
import { Property, Tenant, formatPropertyAddress } from '../../types/property';

export default function PropertyDetails() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const { authenticatedGet, authenticatedPatch } = useAuthenticatedApi();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

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

  const handleActiveToggle = async (isActive: boolean) => {
    if (!property) return;

    try {
      setToggleLoading(true);
      const response = await authenticatedPatch(
        `/properties/properties/${property.id}/update/`,
        { data: { is_active: isActive } }
      );
      setProperty(response);
      toast.success(`Property ${isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error('Failed to update property status');
    } finally {
      setToggleLoading(false);
    }
  };

  const openEditModal = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    loadProperty();
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
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/properties')}
              startIcon={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Back to Properties
            </Button>
            <Button
              onClick={openEditModal}
              startIcon={<PencilIcon className="w-4 h-4" />}
            >
              Edit Property
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              label={property.is_active ? "Active" : "Inactive"}
              defaultChecked={property.is_active}
              onChange={handleActiveToggle}
              disabled={toggleLoading}
              color="blue"
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Property Details</h1>
        <p className="text-gray-600 dark:text-gray-400">{formatPropertyAddress(property)}</p>
      </div>

      <div className="flex flex-col gap-6">
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

        {property.agency ? (
          <AgencyDisplayCard
            agency={property.agency}
            loading={loading}
          />
        ) : (
          <PrivateOwnerDisplayCard
            privateOwners={property.private_owners || []}
            loading={loading}
          />
        )}

        <TenantDisplayCard
          tenants={tenants}
          onTenantsChange={handleTenantsChange}
          allowAdd={false}
          allowRemove={false}
          disabled={false}
          loading={loading}
        />
      </div>

      <EditPropertyForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        property={property}
        onSuccess={handleEditSuccess}
        onTenantsChange={handleTenantsChange}
        tenants={tenants}
        setTenants={setTenants}
      />
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import SearchableDropdown from '../common/SearchableDropdown';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import { useSearchService } from '../../services/search';
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
  const { authenticatedGet, authenticatedPost } = useAuthenticatedApi();
  const searchService = useSearchService();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    property: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
      console.log('Creating beeping alarm with payload:', payload);
      const response = await authenticatedPost('/maintenance/beeping_alarms/', { data: payload });
      console.log('Beeping alarm created successfully:', response);
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
      console.error('Error response data:', error.data);
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

  // Navigation handlers
  const handleManageProperty = () => {
    // Navigate to property management page
    window.open('/properties', '_blank');
  };

  const handleManageAgency = () => {
    // Navigate to agency management page
    window.open('/agencies', '_blank');
  };

  const handleManagePrivateOwners = () => {
    // Navigate to private owners management page
    window.open('/private-owners', '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header onClose={onClose}>Create Beeping Alarm</Modal.Header>
      <Modal.Body>
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl custom-scrollbar">
          <form id="beeping-alarm-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="property" className="text-gray-900 dark:text-gray-100">Property *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageProperty}
                  className="text-xs"
                >
                  Manage Properties
                </Button>
              </div>
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

            {/* Property Information Display */}
            {selectedProperty && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <Label className="text-base font-medium mb-3 text-gray-900 dark:text-gray-100">Property Details</Label>
                
                {/* Property Owner Information */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Property Owner</Label>
                    {selectedProperty.agency && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManageAgency}
                        className="text-xs"
                      >
                        Manage Agencies
                      </Button>
                    )}
                    {selectedProperty.private_owners.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManagePrivateOwners}
                        className="text-xs"
                      >
                        Manage Private Owners
                      </Button>
                    )}
                  </div>
                  
                  {selectedProperty.agency ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-700">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Agency</span>
                      <div className="text-sm text-gray-800 dark:text-gray-100">{selectedProperty.agency.name}</div>
                      <div className="text-gray-600 dark:text-gray-300">{selectedProperty.agency.email}</div>
                      <div className="text-gray-600 dark:text-gray-300">{selectedProperty.agency.phone}</div>
                      
                      {/* Property Managers */}
                      {selectedProperty.agency.property_managers && selectedProperty.agency.property_managers.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Property Managers:</span>
                          </div>
                          <div className="mt-1 space-y-1">
                            {selectedProperty.agency.property_managers.map(pm => (
                              <div key={pm.id} className="text-xs bg-white dark:bg-gray-800 rounded p-2 border border-blue-200 dark:border-blue-700">
                                <div className="font-medium text-gray-800 dark:text-gray-100">{pm.first_name} {pm.last_name}</div>
                                <div className="text-gray-600 dark:text-gray-300">{pm.email}</div>
                                <div className="text-gray-600 dark:text-gray-300">{pm.phone}</div>
                                {pm.notes && <div className="text-gray-500 dark:text-gray-400 italic">{pm.notes}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    selectedProperty.private_owners.length > 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/40 rounded border border-green-200 dark:border-green-700">
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">Private Owners</span>
                        <div className="mt-2 space-y-2">
                          {selectedProperty.private_owners.map(owner => (
                            <div key={owner.id} className="text-sm bg-white dark:bg-gray-800 rounded p-2 border border-green-200 dark:border-green-700">
                              <div className="font-medium text-gray-800 dark:text-gray-100">{owner.first_name} {owner.last_name}</div>
                              <div className="text-gray-600 dark:text-gray-300">{owner.email}</div>
                              <div className="text-gray-600 dark:text-gray-300">{owner.phone}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Tenants for Selected Property */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-medium text-blue-800 dark:text-blue-200">Property Tenants</Label>
                  </div>
                  <div className="mt-2 space-y-2">
                    {selectedProperty.tenants.length === 0 ? (
                      <div className="text-gray-500 dark:text-gray-300 text-sm">No tenants</div>
                    ) : (
                      selectedProperty.tenants.map(tenant => (
                        <div key={tenant.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-900 dark:text-gray-100">{tenant.first_name} {tenant.last_name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-300">{tenant.phone}</span>
                            {tenant.email && (
                              <span className="text-xs text-blue-400 dark:text-blue-300">{tenant.email}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
    </Modal>
  );
}
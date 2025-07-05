import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import SearchableDropdown from '../common/SearchableDropdown';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import { useSearchService } from '../../services/search';

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

      await authenticatedPost('/maintenance/beeping_alarms/', { data: payload });
      
      // Reset form
      setFormData({
        property: null,
      });
      
      setSelectedProperty(null);
      setErrors({});
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Error creating beeping alarm:', error);
      if (error.data) {
        setErrors(error.data);
      }
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Create Beeping Alarm</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          {selectedProperty && selectedProperty.tenants && selectedProperty.tenants.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/40">
              <Label className="text-base font-medium text-blue-800 dark:text-blue-200">Property Tenants</Label>
              <div className="mt-2 space-y-2">
                {selectedProperty.tenants.map(tenant => (
                  <div key={tenant.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-900 dark:text-gray-100">{tenant.first_name} {tenant.last_name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-300">{tenant.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6">
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
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700 dark:text-white"
            >
              {loading ? 'Creating...' : 'Create Beeping Alarm'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
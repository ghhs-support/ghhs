import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import SearchableDropdown from '../common/SearchableDropdown';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';
import { useSearchService } from '../../services/search';
import toast from 'react-hot-toast';
import { Property, Tenant, PrivateOwner, PropertyManager } from '../../types/property';
import { CreateBeepingAlarmProps, CreateBeepingAlarmFormData, BEEPING_ALARM_STATUS_OPTIONS } from '../../types/maintenance';
import { BuildingOfficeIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import InfoCard from '../properties/InfoCard';
import { IssueType } from '../../types/maintenance';


export default function CreateBeepingAlarmForm({ isOpen, onClose, onSuccess }: CreateBeepingAlarmProps) {
  const { authenticatedGet, authenticatedPost } = useAuthenticatedApi();
  const searchService = useSearchService();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const [formData, setFormData] = useState<CreateBeepingAlarmFormData>({
    property: null,
    status: 'new',
    issue_type: null,
    allocation: null,
    allocation_label: null,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [propertiesResponse, issueTypesResponse] = await Promise.all([
        authenticatedGet('/properties/'),
        authenticatedGet('/maintenance/issue_types/')
      ]);
      setProperties(propertiesResponse);
      setIssueTypes(issueTypesResponse);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateBeepingAlarmFormData, value: any) => {
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
    if (!formData.issue_type) {
      newErrors.issue_type = 'Issue type is required';
    }
    if (!formData.notes?.trim()) {
      newErrors.notes = 'Notes are required';
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
        allocation: formData.allocation ? [formData.allocation] : [], // Convert to array
      };
      console.log('Creating beeping alarm with payload:', payload);
      const response = await authenticatedPost('/maintenance/beeping_alarms/', { data: payload });
      console.log('Beeping alarm created successfully:', response);
      setFormData({
        property: null,
        status: 'new',
        issue_type: null,
        allocation: null,
        allocation_label: null,
        notes: ''
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
                          {selectedProperty.unit_number ? `Unit ${selectedProperty.unit_number}, ` : ''}
                          {selectedProperty.street_number} {selectedProperty.street_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedProperty.suburb}, {selectedProperty.state} {selectedProperty.postcode}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Owner */}
                <div className={`rounded-xl border p-6 ${
                  selectedProperty.agency 
                    ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700' 
                    : selectedProperty.private_owners.length > 0 
                    ? 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {selectedProperty.agency ? (
                        <BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : selectedProperty.private_owners.length > 0 ? (
                        <UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-gray-500" />
                      )}
                      <h2 className={`text-lg font-semibold ${
                        selectedProperty.agency 
                          ? 'text-blue-800 dark:text-blue-200' 
                          : selectedProperty.private_owners.length > 0 
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        Property Owner
                      </h2>
                    </div>
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
                  
                  {selectedProperty.agency && (
                    <InfoCard
                      icon={<BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                      title={selectedProperty.agency.name}
                      subtitle="Agency"
                      phone={selectedProperty.agency.phone}
                      email={selectedProperty.agency.email}
                      color="blue"
                    >
                      {selectedProperty.agency.property_managers && selectedProperty.agency.property_managers.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Property Managers</Label>
                            <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                              {selectedProperty.agency.property_managers.length} {selectedProperty.agency.property_managers.length === 1 ? 'manager' : 'managers'}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {selectedProperty.agency.property_managers.map((manager: PropertyManager) => (
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
                  {selectedProperty.private_owners.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-700 dark:text-green-300 font-semibold">Private Owner</span>
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          {selectedProperty.private_owners.length} {selectedProperty.private_owners.length === 1 ? 'Private Owner' : 'Private Owners'}
                        </span>
                      </div>
                      {selectedProperty.private_owners.map((owner: PrivateOwner) => (
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
                      {selectedProperty.tenants.length} {selectedProperty.tenants.length === 1 ? 'Tenant' : 'Tenants'}
                    </span>
                  </div>
                  
                  {selectedProperty.tenants.length === 0 ? (
                    <div className="text-center py-8 text-purple-600 dark:text-purple-400">
                      <UserIcon className="w-12 h-12 mx-auto mb-2 text-purple-300 dark:text-purple-600" />
                      <div>No tenants assigned to this property</div>
                      <div className="text-sm">This property is currently vacant</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {selectedProperty.tenants.map((tenant: Tenant) => (
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
                {/* Allocation */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="allocation" className="text-gray-900 dark:text-gray-100">
                      Allocation
                    </Label>
                  </div>
                  <SearchableDropdown
                    value={formData.allocation ? {
                      value: formData.allocation.toString(),
                      label: formData.allocation_label || formData.allocation.toString()
                    } : null}
                    onChange={(option) => {
                      handleInputChange('allocation', option ? parseInt(option.value) : null);
                      handleInputChange('allocation_label', option ? option.label : null);
                    }}
                    onSearch={searchService.searchUsers} 
                    options={[]} 
                    placeholder="Select a user to allocate"
                    className="w-full"
                    includeAllOption={false}
                  />
                </div>
                {/* Status */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="status" className="text-gray-900 dark:text-gray-100">
                      Status <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <SearchableDropdown
                    value={formData.status ? { value: formData.status, label: BEEPING_ALARM_STATUS_OPTIONS.find(opt => opt.value === formData.status)?.label || '' } : null}
                    onChange={(option) => handleInputChange('status', option ? option.value : null)}
                    options={BEEPING_ALARM_STATUS_OPTIONS}
                    placeholder="Select a status"
                    className="w-full"
                    includeAllOption={false}
                  />
                </div>
                {/* Issue Type */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="issue_type" className="text-gray-900 dark:text-gray-100">
                      Issue Type <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <SearchableDropdown
                    value={formData.issue_type ? { 
                      value: formData.issue_type.toString(),
                      label: issueTypes.find(type => type.id === formData.issue_type)?.name || ''
                    } : null}
                    onChange={(option) => handleInputChange('issue_type', option ? parseInt(option.value) : null)}
                    options={issueTypes.map(type => ({ value: type.id.toString(), label: type.name }))}
                    placeholder="Select an issue type"
                    className="w-full"
                    includeAllOption={false}
                  />
                </div>
                {/* Notes */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100">
                      Notes <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    rows={4} 
                    required
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                    placeholder="Enter notes..." 
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.notes}</p>
                  )}
                </div>
              </div>
            )}
          </form>
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
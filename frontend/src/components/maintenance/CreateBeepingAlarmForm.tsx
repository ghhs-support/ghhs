import React, { useState, useEffect } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Select from '../form/Select';
import TextArea from '../form/input/TextArea';
import Label from '../form/Label';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';

interface IssueType {
  id: number;
  name: string;
  description: string;
}

interface Property {
  id: number;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
}

interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
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

interface CreateBeepingAlarmFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  issue_type: number | null;
  notes: string;
  property: number | null;
  tenant: number[];
  allocation: number[];
  agency: number | null;
  private_owner: number | null;
  status: string;
  is_customer_contacted: boolean;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'requires_call_back', label: 'Requires Call Back' },
  { value: 'awaiting_response', label: 'Awaiting Response' },
  { value: 'to_be_scheduled', label: 'To Be Scheduled' },
  { value: 'to_be_quoted', label: 'To Be Quoted' },
];

export default function CreateBeepingAlarmForm({ isOpen, onClose, onSuccess }: CreateBeepingAlarmFormProps) {
  const { authenticatedGet, authenticatedPost } = useAuthenticatedApi();
  const [loading, setLoading] = useState(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [privateOwners, setPrivateOwners] = useState<PrivateOwner[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    issue_type: null,
    notes: '',
    property: null,
    tenant: [],
    allocation: [],
    agency: null,
    private_owner: null,
    status: 'new',
    is_customer_contacted: false,
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load issue types
      const issueTypesResponse = await authenticatedGet('/maintenance/issue_types/');
      setIssueTypes(issueTypesResponse);
      
      // Load properties
      const propertiesResponse = await authenticatedGet('/maintenance/property-suggestions/');
      setProperties(propertiesResponse.map((item: any) => ({
        id: parseInt(item.value),
        unit_number: null,
        street_number: '',
        street_name: '',
        suburb: '',
        state: '',
        postcode: '',
      })));
      
      // Load tenants
      const tenantsResponse = await authenticatedGet('/maintenance/tenant-suggestions/');
      setTenants(tenantsResponse.map((item: any) => ({
        id: parseInt(item.value),
        first_name: '',
        last_name: '',
        phone: '',
      })));
      
      // Load users (for allocation) - this might need a different endpoint
      try {
        const usersResponse = await authenticatedGet('/users/');
        setUsers(usersResponse);
      } catch (error) {
        console.log('Users endpoint not available, using empty array');
        setUsers([]);
      }
      
      // Load agencies and private owners - these might need different endpoints
      try {
        const agenciesResponse = await authenticatedGet('/properties/agencies/');
        setAgencies(agenciesResponse);
      } catch (error) {
        console.log('Agencies endpoint not available, using empty array');
        setAgencies([]);
      }
      
      try {
        const privateOwnersResponse = await authenticatedGet('/properties/private-owners/');
        setPrivateOwners(privateOwnersResponse);
      } catch (error) {
        console.log('Private owners endpoint not available, using empty array');
        setPrivateOwners([]);
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
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.issue_type) {
      newErrors.issue_type = 'Issue type is required';
    }

    if (!formData.notes.trim()) {
      newErrors.notes = 'Notes are required';
    }

    if (!formData.property) {
      newErrors.property = 'Property is required';
    }

    if (!formData.agency && !formData.private_owner) {
      newErrors.agency = 'Either agency or private owner is required';
    }

    if (formData.agency && formData.private_owner) {
      newErrors.agency = 'Cannot select both agency and private owner';
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
        tenant: formData.tenant.length > 0 ? formData.tenant : [],
        allocation: formData.allocation.length > 0 ? formData.allocation : [],
      };

      await authenticatedPost('/maintenance/beeping_alarms/', { data: payload });
      
      // Reset form
      setFormData({
        issue_type: null,
        notes: '',
        property: null,
        tenant: [],
        allocation: [],
        agency: null,
        private_owner: null,
        status: 'new',
        is_customer_contacted: false,
      });
      
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

  const issueTypeOptions = issueTypes.map(type => ({
    value: type.id.toString(),
    label: type.name
  }));

  const propertyOptions = properties.map(prop => ({
    value: prop.id.toString(),
    label: `${prop.unit_number ? prop.unit_number + '/' : ''}${prop.street_number} ${prop.street_name}, ${prop.suburb} ${prop.state} ${prop.postcode}`
  }));

  const tenantOptions = tenants.map(tenant => ({
    value: tenant.id.toString(),
    label: `${tenant.first_name} ${tenant.last_name} - ${tenant.phone}`
  }));

  const userOptions = users.map(user => ({
    value: user.id.toString(),
    label: `${user.first_name} ${user.last_name} (${user.username})`
  }));

  const agencyOptions = agencies.map(agency => ({
    value: agency.id.toString(),
    label: agency.name
  }));

  const privateOwnerOptions = privateOwners.map(owner => ({
    value: owner.id.toString(),
    label: `${owner.first_name} ${owner.last_name}`
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Create Beeping Alarm</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Issue Type */}
          <div>
            <Label htmlFor="issue_type">Issue Type *</Label>
            <Select
              options={issueTypeOptions}
              placeholder="Select issue type"
              onChange={(value) => handleInputChange('issue_type', value ? parseInt(value) : null)}
              defaultValue={formData.issue_type?.toString() || ''}
            />
            {errors.issue_type && (
              <p className="mt-1 text-sm text-red-600">{errors.issue_type}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes *</Label>
            <TextArea
              value={formData.notes}
              onChange={(value) => handleInputChange('notes', value)}
              placeholder="Enter detailed notes about the issue"
              rows={4}
              error={!!errors.notes}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            )}
          </div>

          {/* Property */}
          <div>
            <Label htmlFor="property">Property *</Label>
            <Select
              options={propertyOptions}
              placeholder="Select property"
              onChange={(value) => handleInputChange('property', value ? parseInt(value) : null)}
              defaultValue={formData.property?.toString() || ''}
            />
            {errors.property && (
              <p className="mt-1 text-sm text-red-600">{errors.property}</p>
            )}
          </div>

          {/* Agency or Private Owner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agency">Agency</Label>
              <Select
                options={agencyOptions}
                placeholder="Select agency"
                onChange={(value) => {
                  handleInputChange('agency', value ? parseInt(value) : null);
                  if (value) handleInputChange('private_owner', null);
                }}
                defaultValue={formData.agency?.toString() || ''}
              />
            </div>
            <div>
              <Label htmlFor="private_owner">Private Owner</Label>
              <Select
                options={privateOwnerOptions}
                placeholder="Select private owner"
                onChange={(value) => {
                  handleInputChange('private_owner', value ? parseInt(value) : null);
                  if (value) handleInputChange('agency', null);
                }}
                defaultValue={formData.private_owner?.toString() || ''}
              />
            </div>
          </div>
          {errors.agency && (
            <p className="mt-1 text-sm text-red-600">{errors.agency}</p>
          )}

          {/* Tenants */}
          <div>
            <Label htmlFor="tenant">Tenants</Label>
            <Select
              options={tenantOptions}
              placeholder="Select tenants"
              onChange={(value) => handleInputChange('tenant', value ? [parseInt(value)] : [])}
              defaultValue=""
            />
          </div>

          {/* Allocation */}
          <div>
            <Label htmlFor="allocation">Allocation</Label>
            <Select
              options={userOptions}
              placeholder="Select users to allocate"
              onChange={(value) => handleInputChange('allocation', value ? [parseInt(value)] : [])}
              defaultValue=""
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              options={STATUS_OPTIONS}
              placeholder="Select status"
              onChange={(value) => handleInputChange('status', value || 'new')}
              defaultValue={formData.status}
            />
          </div>

          {/* Customer Contacted */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_customer_contacted"
              checked={formData.is_customer_contacted}
              onChange={(e) => handleInputChange('is_customer_contacted', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="is_customer_contacted" className="ml-2">
              Customer Contacted
            </Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Beeping Alarm'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
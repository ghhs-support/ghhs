import React, { useEffect, useState } from 'react';
import FiltersCard, { FilterConfig, FilterValue, Option } from '../common/FiltersCard';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';

// Define a proper User type based on the backend serializer
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface BeepingAlarmsFiltersCardProps {
  onAllocationChange: (allocationId: string | null) => void;
  onTenantChange: (tenantId: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onCustomerContactedChange: (customerContacted: string | null) => void;
  onPropertyChange: (propertyId: string | null) => void;
  onAgencyPrivateChange: (agencyPrivate: string | null) => void;
  onCreatedAtChange: (createdAtSingle: string | null, createdAtFrom: string | null, createdAtTo: string | null, mode: 'single' | 'range') => void;
  currentAllocation: string | null;
  currentTenant: string | null;
  currentStatus: string | null;
  currentCustomerContacted: string | null;
  currentProperty: string | null;
  currentAgencyPrivate: string | null;
  currentCreatedAtSingle: string | null;
  currentCreatedAtFrom: string | null;
  currentCreatedAtTo: string | null;
  currentCreatedAtMode: 'single' | 'range';
}

const BeepingAlarmsFiltersCard: React.FC<BeepingAlarmsFiltersCardProps> = ({ 
  onAllocationChange,
  onTenantChange,
  onStatusChange,
  onCustomerContactedChange,
  onPropertyChange,
  onAgencyPrivateChange,
  onCreatedAtChange,
  currentAllocation,
  currentTenant,
  currentStatus,
  currentCustomerContacted,
  currentProperty,
  currentAgencyPrivate,
  currentCreatedAtSingle,
  currentCreatedAtFrom,
  currentCreatedAtTo,
  currentCreatedAtMode
}) => {
  const [allocations, setAllocations] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedGet } = useAuthenticatedApi();

  const getUserDisplayName = (user: User): string => {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    return fullName || user.username;
  };

  const allocationOptions = React.useMemo(() => 
    allocations.map(user => ({
      value: user.id.toString(),
      label: getUserDisplayName(user)
    }))
  , [allocations]);

  // Status options based on backend STATUS_CHOICES
  const statusOptions: Option[] = [
    { value: 'new', label: 'New' },
    { value: 'requires_call_back', label: 'Requires Call Back' },
    { value: 'awaiting_response', label: 'Awaiting Response' },
    { value: 'to_be_scheduled', label: 'To Be Scheduled' },
    { value: 'to_be_quoted', label: 'To Be Quoted' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Customer contacted options
  const customerContactedOptions: Option[] = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' }
  ];

  // Agency/Private options
  const agencyPrivateOptions: Option[] = [
    { value: 'agency', label: 'Agency' },
    { value: 'private', label: 'Private' }
  ];

  // Initialize filter values
  const [filterValues, setFilterValues] = useState<FilterValue>({
    allocation: currentAllocation ? 
      allocationOptions.find(opt => opt.value === currentAllocation) || null : null,
    tenant: currentTenant ? 
      { value: currentTenant, label: currentTenant } : null,
    status: currentStatus ?
      statusOptions.find(opt => opt.value === currentStatus) || null : null,
    customerContacted: currentCustomerContacted ?
      customerContactedOptions.find(opt => opt.value === currentCustomerContacted) || null : null,
    property: currentProperty ?
      { value: currentProperty, label: currentProperty } : null,
    agencyPrivate: currentAgencyPrivate ?
      agencyPrivateOptions.find(opt => opt.value === currentAgencyPrivate) || null : null,
    createdAt: (currentCreatedAtSingle || currentCreatedAtFrom || currentCreatedAtTo) ? {
      mode: currentCreatedAtMode,
      single: currentCreatedAtSingle || undefined,
      from: currentCreatedAtFrom || undefined,
      to: currentCreatedAtTo || undefined
    } : null
  });

  useEffect(() => {
    let mounted = true;

    const fetchAllocations = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedGet('/common/users/');
        if (mounted) {
          setAllocations(response);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching users:', error);
          setError('Failed to load users. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAllocations();

    return () => {
      mounted = false;
    };
  }, []);

  // Define filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      id: 'allocation',
      type: 'dropdown',
      label: 'Allocation',
      placeholder: 'Search allocations...',
      allOptionLabel: 'All Allocations',
      options: allocationOptions,
      loading: loading,
      error: error
    },
    {
      id: 'tenant',
      type: 'searchable-dropdown',
      label: 'Tenant',
      placeholder: 'Search by tenant name or mobile...',
      allOptionLabel: 'All Tenants',
      onSearch: async (query: string) => {
        console.log('Searching for tenant with query:', query);
        try {
          const response = await authenticatedGet('/maintenance/tenant-suggestions/', {
            params: { q: query }
          });
          console.log('Tenant search response:', response);
          return response || [];
        } catch (error) {
          console.error('Error fetching tenant suggestions:', error);
          return [];
        }
      }
    },
    {
      id: 'status',
      type: 'dropdown',
      label: 'Status',
      placeholder: 'Select status...',
      allOptionLabel: 'All Statuses',
      options: statusOptions
    },
    {
      id: 'customerContacted',
      type: 'dropdown',
      label: 'Customer Contacted',
      placeholder: 'Select option...',
      allOptionLabel: 'All',
      options: customerContactedOptions
    },
    {
      id: 'property',
      type: 'searchable-dropdown',
      label: 'Property Address',
      placeholder: 'Search by address...',
      allOptionLabel: 'All Properties',
      onSearch: async (query: string) => {
        console.log('Searching for property with query:', query);
        try {
          const response = await authenticatedGet('/maintenance/property-suggestions/', {
            params: { q: query }
          });
          console.log('Property search response:', response);
          return response || [];
        } catch (error) {
          console.error('Error fetching property suggestions:', error);
          return [];
        }
      }
    },
    {
      id: 'agencyPrivate',
      type: 'dropdown',
      label: 'Agency/Private',
      placeholder: 'Select type...',
      allOptionLabel: 'All Types',
      options: agencyPrivateOptions
    },
    {
      id: 'createdAt',
      type: 'date-filter',
      label: 'Created At',
      singleDateLabel: 'Specific Date',
      dateRangeLabel: 'Date Range',
      dateFromLabel: 'From Date',
      dateToLabel: 'To Date',
      singleDatePlaceholder: 'Select date',
      dateFromPlaceholder: 'Select start date',
      dateToPlaceholder: 'Select end date'
    }
  ];

  const handleValuesChange = (values: FilterValue) => {
    setFilterValues(values);
  };

  const handleApply = (values: FilterValue) => {
    onAllocationChange(values.allocation?.value || null);
    onTenantChange(values.tenant?.value || null);
    onStatusChange(values.status?.value || null);
    onCustomerContactedChange(values.customerContacted?.value || null);
    onPropertyChange(values.property?.value || null);
    onAgencyPrivateChange(values.agencyPrivate?.value || null);
    
    // Handle created at date filter
    const createdAtValue = values.createdAt as { mode?: 'single' | 'range'; single?: string; from?: string; to?: string } | null;
    onCreatedAtChange(
      createdAtValue?.single || null,
      createdAtValue?.from || null,
      createdAtValue?.to || null,
      createdAtValue?.mode || 'single'
    );
  };

  return (
    <FiltersCard
      title="Filters"
      description="Filter your beeping alarms"
      filters={filterConfigs}
      values={filterValues}
      onValuesChange={handleValuesChange}
      onApply={handleApply}
      loading={loading}
    />
  );
};

export default BeepingAlarmsFiltersCard;

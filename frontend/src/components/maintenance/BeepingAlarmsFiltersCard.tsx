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
  currentAllocation: string | null;
  currentTenant: string | null;
  currentStatus: string | null;
  currentCustomerContacted: string | null;
}

const BeepingAlarmsFiltersCard: React.FC<BeepingAlarmsFiltersCardProps> = ({ 
  onAllocationChange,
  onTenantChange,
  onStatusChange,
  onCustomerContactedChange,
  currentAllocation,
  currentTenant,
  currentStatus,
  currentCustomerContacted
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

  // Initialize filter values
  const [filterValues, setFilterValues] = useState<FilterValue>({
    allocation: currentAllocation ? 
      allocationOptions.find(opt => opt.value === currentAllocation) || null : null,
    tenant: currentTenant ? 
      { value: currentTenant, label: currentTenant } : null,
    status: currentStatus ?
      statusOptions.find(opt => opt.value === currentStatus) || null : null,
    customerContacted: currentCustomerContacted ?
      customerContactedOptions.find(opt => opt.value === currentCustomerContacted) || null : null
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

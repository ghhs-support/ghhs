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
  currentAllocation: string | null;
  currentTenant: string | null;
}

const BeepingAlarmsFiltersCard: React.FC<BeepingAlarmsFiltersCardProps> = ({ 
  onAllocationChange,
  onTenantChange,
  currentAllocation,
  currentTenant
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

  // Initialize filter values
  const [filterValues, setFilterValues] = useState<FilterValue>({
    allocation: currentAllocation ? 
      allocationOptions.find(opt => opt.value === currentAllocation) || null : null,
    tenant: currentTenant ? 
      { value: currentTenant, label: currentTenant } : null // You might need to fetch tenant label
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
    }
  ];

  const handleValuesChange = (values: FilterValue) => {
    setFilterValues(values);
  };

  const handleApply = (values: FilterValue) => {
    onAllocationChange(values.allocation?.value || null);
    onTenantChange(values.tenant?.value || null);
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

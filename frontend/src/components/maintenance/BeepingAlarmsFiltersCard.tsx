import React, { useEffect, useState } from 'react';
import FiltersCard, { FilterConfig, FilterValue, Option } from '../common/FiltersCard';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useSearchService } from '../../services/search';
import { 
  User, 
  BeepingAlarmStatus, 
  BEEPING_ALARM_STATUS_OPTIONS,
  CUSTOMER_CONTACTED_OPTIONS,
  AGENCY_PRIVATE_OPTIONS,
  BeepingAlarmFilterMode,
  BeepingAlarmFilters
} from '../../types/maintenance';

interface BeepingAlarmsFiltersCardProps {
  onAllocationChange: (allocationId: string | null) => void;
  onTenantChange: (tenantId: string | null) => void;
  onStatusChange: (status: BeepingAlarmStatus | null) => void;
  onCustomerContactedChange: (customerContacted: string | null) => void;
  onPropertyChange: (propertyId: string | null) => void;
  onAgencyPrivateChange: (agencyPrivate: 'agency' | 'private' | null) => void;
  onCreatedAtChange: (createdAtSingle: string | null, createdAtFrom: string | null, createdAtTo: string | null, mode: BeepingAlarmFilterMode) => void;
  currentAllocation: string | null;
  currentTenant: string | null;
  currentStatus: BeepingAlarmStatus | null;
  currentCustomerContacted: string | null;
  currentProperty: string | null;
  currentAgencyPrivate: 'agency' | 'private' | null;
  currentCreatedAtSingle: string | null;
  currentCreatedAtFrom: string | null;
  currentCreatedAtTo: string | null;
  currentCreatedAtMode: BeepingAlarmFilterMode;
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
  const searchService = useSearchService();

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

  // Replace the hardcoded options with the constants
  const statusOptions = BEEPING_ALARM_STATUS_OPTIONS;
  const customerContactedOptions = CUSTOMER_CONTACTED_OPTIONS;
  const agencyPrivateOptions = AGENCY_PRIVATE_OPTIONS;

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
      onSearch: searchService.searchTenants
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
      onSearch: searchService.searchProperties
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
    // Type guard to check if a value is an Option
    const isOption = (value: any): value is Option => {
      return value && typeof value === 'object' && 'value' in value && 'label' in value;
    };

    onAllocationChange(isOption(values.allocation) ? values.allocation.value : null);
    onTenantChange(isOption(values.tenant) ? values.tenant.value : null);
    onStatusChange(isOption(values.status) ? values.status.value as BeepingAlarmStatus : null);
    onCustomerContactedChange(isOption(values.customerContacted) ? values.customerContacted.value : null);
    onPropertyChange(isOption(values.property) ? values.property.value : null);
    onAgencyPrivateChange(isOption(values.agencyPrivate) ? values.agencyPrivate.value as 'agency' | 'private' : null);
    
    // Handle created at date filter
    const createdAtValue = values.createdAt as { mode?: BeepingAlarmFilterMode; single?: string; from?: string; to?: string } | null;
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

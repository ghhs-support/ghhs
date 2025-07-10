import React, { useEffect, useState } from 'react';
import LayoutFiltersCard, { Option, FilterValue } from '../common/FiltersCard';
import SearchableDropdown from '../common/SearchableDropdown';
import DatePicker from '../form/date-picker';
import Switch from '../form/switch/Switch';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useSearchService } from '../../services/search';
import { 
  User, 
  BeepingAlarmStatus, 
  BEEPING_ALARM_STATUS_OPTIONS,
  CUSTOMER_CONTACTED_OPTIONS,
  AGENCY_PRIVATE_OPTIONS,
  BeepingAlarmFilterMode,
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
  const [datePickerKey, setDatePickerKey] = useState(0);
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

  const statusOptions = BEEPING_ALARM_STATUS_OPTIONS;
  const customerContactedOptions = CUSTOMER_CONTACTED_OPTIONS;
  const agencyPrivateOptions = AGENCY_PRIVATE_OPTIONS;

  // Local filter values state
  const [localValues, setLocalValues] = useState<FilterValue>({
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

  // Applied filter values state
  const [appliedValues, setAppliedValues] = useState<FilterValue>({});

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

  const handleFilterChange = (filterId: string, value: Option | null | { mode?: BeepingAlarmFilterMode; single?: string; from?: string; to?: string }) => {
    setLocalValues(prev => ({ ...prev, [filterId]: value }));
  };

  const handleDateFilterChange = (field: 'mode' | 'single' | 'from' | 'to', value: string | BeepingAlarmFilterMode) => {
    const currentValue = localValues.createdAt as { mode?: BeepingAlarmFilterMode; single?: string; from?: string; to?: string } || {};
    
    if (field === 'mode') {
      const newValue = { 
        mode: value as BeepingAlarmFilterMode,
        single: undefined,
        from: undefined,
        to: undefined
      };
      handleFilterChange('createdAt', newValue);
      setDatePickerKey(prev => prev + 1);
    } else {
      const newValue = { 
        ...currentValue, 
        [field]: value as string 
      };
      handleFilterChange('createdAt', newValue);
    }
  };

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApply = () => {
    const isOption = (value: any): value is Option => {
      return value && typeof value === 'object' && 'value' in value && 'label' in value;
    };

    onAllocationChange(isOption(localValues.allocation) ? localValues.allocation.value : null);
    onTenantChange(isOption(localValues.tenant) ? localValues.tenant.value : null);
    onStatusChange(isOption(localValues.status) ? localValues.status.value as BeepingAlarmStatus : null);
    onCustomerContactedChange(isOption(localValues.customerContacted) ? localValues.customerContacted.value : null);
    onPropertyChange(isOption(localValues.property) ? localValues.property.value : null);
    onAgencyPrivateChange(isOption(localValues.agencyPrivate) ? localValues.agencyPrivate.value as 'agency' | 'private' : null);
    
    const createdAtValue = localValues.createdAt as { mode?: BeepingAlarmFilterMode; single?: string; from?: string; to?: string } | null;
    onCreatedAtChange(
      createdAtValue?.single || null,
      createdAtValue?.from || null,
      createdAtValue?.to || null,
      createdAtValue?.mode || 'single'
    );

    setAppliedValues(localValues);
  };

  const handleClearAll = () => {
    const clearedValues = {
      allocation: null,
      tenant: null,
      status: null,
      customerContacted: null,
      property: null,
      agencyPrivate: null,
      createdAt: null
    };

    setLocalValues(clearedValues);
    setAppliedValues(clearedValues);
    setDatePickerKey(prev => prev + 1);

    onAllocationChange(null);
    onTenantChange(null);
    onStatusChange(null);
    onCustomerContactedChange(null);
    onPropertyChange(null);
    onAgencyPrivateChange(null);
    onCreatedAtChange(null, null, null, 'single');
  };

  const handleIndividualFilterClear = (filterId: string) => {
    const clearedValues = { ...localValues, [filterId]: null };
    setLocalValues(clearedValues);
    setAppliedValues(clearedValues);

    if (filterId === 'createdAt') {
      setDatePickerKey(prev => prev + 1);
    }

    switch (filterId) {
      case 'allocation':
        onAllocationChange(null);
        break;
      case 'tenant':
        onTenantChange(null);
        break;
      case 'status':
        onStatusChange(null);
        break;
      case 'customerContacted':
        onCustomerContactedChange(null);
        break;
      case 'property':
        onPropertyChange(null);
        break;
      case 'agencyPrivate':
        onAgencyPrivateChange(null);
        break;
      case 'createdAt':
        onCreatedAtChange(null, null, null, 'single');
        break;
    }
  };

  const hasPendingChanges = JSON.stringify(localValues) !== JSON.stringify(appliedValues);
  const hasActiveFilters = Object.values(appliedValues).some(value => {
    if (value === null || value === undefined) return false;
    
    if (typeof value === 'object' && ('mode' in value || 'from' in value || 'single' in value)) {
      const dateValue = value as { mode?: BeepingAlarmFilterMode; single?: string; from?: string; to?: string };
      return !!(dateValue.single || dateValue.from || dateValue.to);
    }
    
    return true;
  });

    const activeFilters = Object.entries(appliedValues)
    .filter(([_, value]) => {
      if (value === null || value === undefined) return false;
      
      if (typeof value === 'object' && ('mode' in value || 'from' in value || 'single' in value)) {
        const dateValue = value as { mode?: BeepingAlarmFilterMode; single?: string; from?: string; to?: string };
        return !!(dateValue.single || dateValue.from || dateValue.to);
      }
      
      return true;
    })
    .map(([filterId, value]) => {
      const filterLabels = {
        allocation: 'Allocation',
        tenant: 'Tenant',
        status: 'Status',
        customerContacted: 'Customer Contacted',
        property: 'Property',
        agencyPrivate: 'Agency/Private',
        createdAt: 'Created At'
      };

      let displayValue = '';
      if (value && typeof value === 'object' && ('mode' in value || 'from' in value || 'single' in value)) {
        const dateValue = value as { mode?: BeepingAlarmFilterMode; single?: string; from?: string; to?: string };
        if (dateValue.single) {
          displayValue = dateValue.single;
        } else if (dateValue.from || dateValue.to) {
          displayValue = `${dateValue.from || ''} - ${dateValue.to || ''}`;
        }
      } else if (value) {
        displayValue = (value as Option).label;
      }

      return {
        id: filterId,
        label: filterLabels[filterId as keyof typeof filterLabels],
        value: displayValue,
        onClear: () => handleIndividualFilterClear(filterId)
      };
    });

  const dateValue = localValues.createdAt as { mode?: BeepingAlarmFilterMode; single?: string; from?: string; to?: string } || { mode: 'single' };
  const currentMode = dateValue.mode || 'single';

  return (
    <LayoutFiltersCard
      title="Filters"
      description="Filter your beeping alarms"
      activeFilters={activeFilters}
      onApply={handleApply}
      onClearAll={handleClearAll}
      applyDisabled={!hasPendingChanges}
      clearAllDisabled={!hasActiveFilters}
      loading={loading}
    >
      <SearchableDropdown
        label="Allocation"
        value={localValues.allocation as Option | null}
        onChange={(option) => handleFilterChange('allocation', option)}
        options={allocationOptions}
        placeholder="Search allocations..."
        allOptionLabel="All Allocations"
        loading={loading}
        error={error}
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Tenant"
        value={localValues.tenant as Option | null}
        onChange={(option) => handleFilterChange('tenant', option)}
        onSearch={searchService.searchTenants}
        placeholder="Search by tenant name or mobile..."
        allOptionLabel="All Tenants"
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Status"
        value={localValues.status as Option | null}
        onChange={(option) => handleFilterChange('status', option)}
        options={statusOptions}
        placeholder="Select status..."
        allOptionLabel="All Statuses"
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Customer Contacted"
        value={localValues.customerContacted as Option | null}
        onChange={(option) => handleFilterChange('customerContacted', option)}
        options={customerContactedOptions}
        placeholder="Select option..."
        allOptionLabel="All"
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Property Address"
        value={localValues.property as Option | null}
        onChange={(option) => handleFilterChange('property', option)}
        onSearch={searchService.searchProperties}
        placeholder="Search by address..."
        allOptionLabel="All Properties"
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Agency/Private"
        value={localValues.agencyPrivate as Option | null}
        onChange={(option) => handleFilterChange('agencyPrivate', option)}
        options={agencyPrivateOptions}
        placeholder="Select type..."
        allOptionLabel="All Types"
        showApplyButton={false}
        showClearButton={true}
      />

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Created At
        </label>
        
        <div className="flex items-center space-x-3">
          <span className={`text-sm ${currentMode === 'single' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
            Specific Date
          </span>
          <Switch
            label=""
            defaultChecked={currentMode === 'range'}
            onChange={(checked) => handleDateFilterChange('mode', checked ? 'range' : 'single')}
          />
          <span className={`text-sm ${currentMode === 'range' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
            Date Range
          </span>
        </div>

        <div className="space-y-2">
          {currentMode === 'single' ? (
            <DatePicker
              key={`single-${datePickerKey}`}
              id="created-at-single"
              placeholder="Select date"
              defaultDate={dateValue.single}
              onChange={(selectedDates) => {
                if (selectedDates.length > 0) {
                  const selectedDate = selectedDates[0];
                  const localDateString = getLocalDateString(selectedDate);
                  handleDateFilterChange('single', localDateString);
                } else {
                  handleDateFilterChange('single', '');
                }
              }}
            />
          ) : (
            <div className="space-y-2">
              <DatePicker
                key={`from-${datePickerKey}`}
                id="created-at-from"
                placeholder="Select start date"
                defaultDate={dateValue.from}
                onChange={(selectedDates) => {
                  if (selectedDates.length > 0) {
                    const selectedDate = selectedDates[0];
                    const localDateString = getLocalDateString(selectedDate);
                    handleDateFilterChange('from', localDateString);
                  } else {
                    handleDateFilterChange('from', '');
                  }
                }}
              />
              <DatePicker
                key={`to-${datePickerKey}`}
                id="created-at-to"
                placeholder="Select end date"
                defaultDate={dateValue.to}
                onChange={(selectedDates) => {
                  if (selectedDates.length > 0) {
                    const selectedDate = selectedDates[0];
                    const localDateString = getLocalDateString(selectedDate);
                    handleDateFilterChange('to', localDateString);
                  } else {
                    handleDateFilterChange('to', '');
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </LayoutFiltersCard>
  );
};

export default BeepingAlarmsFiltersCard;

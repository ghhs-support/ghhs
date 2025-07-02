import React, { useEffect, useState } from 'react';
import ComponentCard from '../common/ComponentCard';
import SearchableDropdown from '../common/SearchableDropdown';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Button from '../ui/button/Button';
import Badge from "../ui/badge/Badge";

// Define a proper User type based on the backend serializer
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Option {
  value: string;
  label: string;
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
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [selectedTenantOption, setSelectedTenantOption] = useState<Option | null>(null);
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

  useEffect(() => {
    if (currentAllocation) {
      const option = allocationOptions.find(opt => opt.value === currentAllocation);
      if (option) {
        setSelectedOption(option);
      }
    }
  }, [currentAllocation, allocationOptions]);

  const handleApplyFilters = () => {
    onAllocationChange(selectedOption?.value || null);
    onTenantChange(selectedTenantOption?.value || null);
  };

  return (
    <ComponentCard 
      title="Filters"
      desc="Filter your beeping alarms"
    >
      <div className="space-y-4">
        <SearchableDropdown
          label="Allocation"
          options={allocationOptions}
          value={selectedOption}
          onChange={setSelectedOption}
          loading={loading}
          error={error}
          placeholder="Search allocations..."
          allOptionLabel="All Allocations"
          showApplyButton={false}
          showClearButton={true}
        />

        <SearchableDropdown
          label="Tenant"
          value={selectedTenantOption}
          onChange={setSelectedTenantOption}
          onSearch={async (query) => {
            console.log('Searching for tenant with query:', query);
            try {
              // Always call the API - let the backend handle empty queries by returning all tenants
              const response = await authenticatedGet('/maintenance/tenant-suggestions/', {
                params: { q: query }
              });
              console.log('Tenant search response:', response);
              return response || [];
            } catch (error) {
              console.error('Error fetching tenant suggestions:', error);
              return [];
            }
          }}
          placeholder="Search by tenant name or mobile..."
          allOptionLabel="All Tenants"
          showApplyButton={false}
          showClearButton={true}
        />

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleApplyFilters}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
            disabled={loading}
          >
            Apply Filters
          </Button>
          <Button
            onClick={() => {
              setSelectedOption(null);
              setSelectedTenantOption(null);
              onAllocationChange(null);
              onTenantChange(null);
            }}
            variant="outline"
            className="text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 px-4 py-2"
            disabled={loading}
          >
            Clear Filters
          </Button>
        </div>

        <div className="pt-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Active Filters:</span>
            {!selectedOption && !selectedTenantOption ? (
              <span className="text-gray-500 dark:text-gray-400 italic">None</span>
            ) : (
              <div className="flex flex-wrap gap-2 ml-2">
                {selectedOption && (
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1">
                    <span className="text-xs text-gray-700 dark:text-gray-200">
                      Allocation: {selectedOption.label}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedOption(null);
                        onAllocationChange(null);
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      aria-label="Remove allocation filter"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                {selectedTenantOption && (
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1">
                    <span className="text-xs text-gray-700 dark:text-gray-200">
                      Tenant: {selectedTenantOption.label}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedTenantOption(null);
                        onTenantChange(null);
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      aria-label="Remove tenant filter"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ComponentCard>
  );
};

export default BeepingAlarmsFiltersCard;

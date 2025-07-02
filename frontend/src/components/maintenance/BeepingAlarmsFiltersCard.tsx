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
  currentAllocation: string | null;
}

const BeepingAlarmsFiltersCard: React.FC<BeepingAlarmsFiltersCardProps> = ({ 
  onAllocationChange,
  currentAllocation 
}) => {
  const [allocations, setAllocations] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
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

  const handleApplyFilter = (option: Option | null) => {
    onAllocationChange(option?.value || null);
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
          onApply={handleApplyFilter}
          loading={loading}
          error={error}
          placeholder="Search allocations..."
          allOptionLabel="All Allocations"
          showApplyButton={true}
          showClearButton={true}
        />

        {/* Active Filters Section */}
        <div className="pt-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Active Filters:</span>
            {!selectedOption ? (
              <span className="text-gray-500 dark:text-gray-400 italic">None</span>
            ) : (
              <div className="flex flex-wrap gap-2 ml-2">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1">
                  <span className="text-xs text-gray-700 dark:text-gray-200">
                    Allocation: {selectedOption.label}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ComponentCard>
  );
};

export default BeepingAlarmsFiltersCard;

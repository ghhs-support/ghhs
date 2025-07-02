import React, { useEffect, useState } from 'react';
import ComponentCard from '../common/ComponentCard';
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

interface BeepingAlarmsFiltersCardProps {
  onAllocationChange: (allocationId: string | null) => void;
  currentAllocation: string | null;
}

const BeepingAlarmsFiltersCard: React.FC<BeepingAlarmsFiltersCardProps> = ({ 
  onAllocationChange,
  currentAllocation 
}) => {
  const [allocations, setAllocations] = useState<User[]>([]);
  const [tempAllocation, setTempAllocation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedGet } = useAuthenticatedApi();

  // Add console.log to debug
  console.log('Current Allocation:', currentAllocation);
  console.log('Temp Allocation:', tempAllocation);
  console.log('All Allocations:', allocations);

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
    setTempAllocation(currentAllocation || '');
  }, [currentAllocation]);

  const handleAllocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTempAllocation(event.target.value);
  };

  const handleApplyFilters = () => {
    console.log("Applying filter:", tempAllocation);
    onAllocationChange(tempAllocation || null);
  };

  const handleClearFilters = () => {
    setTempAllocation('');
    onAllocationChange(null);
  };

  const getUserDisplayName = (user: User): string => {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    return fullName || user.username;
  };

  const getActiveFilters = () => {
    const filters = [];
    if (currentAllocation) {
      const selectedUser = allocations.find(user => user.id === Number(currentAllocation));
      if (selectedUser) {
        filters.push({
          type: 'Allocation',
          value: getUserDisplayName(selectedUser),
          onRemove: handleClearFilters
        });
      }
    }
    return filters;
  };

  return (
    <ComponentCard 
      title="Filters"
      desc="Filter your beeping alarms"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="allocation" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Allocation
          </label>
          {error ? (
            <div className="text-red-500 text-sm mb-2">{error}</div>
          ) : (
            <select
              id="allocation"
              value={tempAllocation}
              onChange={handleAllocationChange}
              disabled={loading}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Allocations</option>
              {allocations.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserDisplayName(user)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleApplyFilters}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={loading}
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="w-full text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
            disabled={loading}
          >
            Clear Filters
          </Button>
        </div>

        {/* Active Filters Section - Add debug info */}
        <div className="pt-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Active Filters:</span>
            {getActiveFilters().length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400 italic">None</span>
            ) : (
              <div className="flex flex-wrap gap-2 ml-2">
                {getActiveFilters().map((filter, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1"
                  >
                    <span className="text-xs text-gray-700 dark:text-gray-200">
                      {filter.type}: {filter.value}
                    </span>
                    <button
                      onClick={filter.onRemove}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      aria-label={`Remove ${filter.type} filter`}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ComponentCard>
  );
};

export default BeepingAlarmsFiltersCard;

import React, { useEffect, useState } from 'react';
import ComponentCard from '../common/ComponentCard';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Button from '../ui/button/Button';

// Define a proper User type based on the backend serializer
interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface BeepingAlarmsFiltersCardProps {
  onAllocationChange: (allocationId: string | null) => void;
}

const BeepingAlarmsFiltersCard: React.FC<BeepingAlarmsFiltersCardProps> = ({ onAllocationChange }) => {
  const [allocations, setAllocations] = useState<User[]>([]);
  const [tempAllocation, setTempAllocation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedGet } = useAuthenticatedApi();

  useEffect(() => {
    let mounted = true;

    const fetchAllocations = async () => {
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

  const handleAllocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTempAllocation(event.target.value);
  };

  const handleApplyFilters = () => {
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
            className="w-full"
            disabled={loading}
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleClearFilters}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
};

export default BeepingAlarmsFiltersCard;

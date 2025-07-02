import React, { useEffect, useState } from 'react';
import ComponentCard from '../common/ComponentCard';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { BeepingAlarm } from '../../types/maintenance';

// Use the existing type from BeepingAlarm's allocation
type User = BeepingAlarm['allocation'][0];

interface BeepingAlarmsFiltersCardProps {
  onAllocationChange: (allocationId: string | null) => void;
}

const BeepingAlarmsFiltersCard: React.FC<BeepingAlarmsFiltersCardProps> = ({ onAllocationChange }) => {
  const [allocations, setAllocations] = useState<User[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<string>('');
  const api = useAuthenticatedApi();

  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        const response = await api.get('/common/users/');
        setAllocations(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchAllocations();
  }, [api]);

  const handleAllocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedAllocation(value);
    onAllocationChange(value || null);
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
          <select
            id="allocation"
            value={selectedAllocation}
            onChange={handleAllocationChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Allocations</option>
            {allocations.map((user) => (
              <option key={user.id} value={user.id}>
                {`${user.first_name} ${user.last_name}`.trim() || user.username}
              </option>
            ))}
          </select>
        </div>
      </div>
    </ComponentCard>
  );
};

export default BeepingAlarmsFiltersCard;

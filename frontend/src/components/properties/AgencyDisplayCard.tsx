import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Label from '../form/Label';
import InfoCard from './InfoCard';
import { Agency, PropertyManager } from '../../types/property';

interface AgencyDisplayCardProps {
  agency: Agency | null;
  loading?: boolean;
}

export default function AgencyDisplayCard({
  agency,
  loading = false,
}: AgencyDisplayCardProps) {
  if (loading) {
    return (
      <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-gray-800">
        <div className="text-blue-600 dark:text-blue-400 text-sm py-4 text-center">
          Loading agency information...
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <BuildingOfficeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <Label className="text-base font-medium text-gray-900 dark:text-gray-200">
            Property Agency
          </Label>
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-sm py-4 text-center">
          No agency assigned to this property
        </div>
      </div>
    );
  }

  return (
    <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-base font-medium text-blue-900 dark:text-blue-200">
          <BuildingOfficeIcon className="w-5 h-5 inline mr-2" />
          Property Agency
        </Label>
      </div>
      
      <div className="flex justify-end mb-2">
        <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
          1 agency
        </span>
      </div>
      
      <div className="space-y-2">
        <InfoCard
          icon={<BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          title={agency.name}
          subtitle="Agency"
          phone={agency.phone}
          email={agency.email}
          color="blue"
        >
          {agency.property_managers && agency.property_managers.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Property Managers
                </Label>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                  {agency.property_managers.length} {agency.property_managers.length === 1 ? 'manager' : 'managers'}
                </span>
              </div>
              <div className="space-y-2">
                {agency.property_managers.map((manager: PropertyManager) => (
                  <InfoCard
                    key={manager.id}
                    title={`${manager.first_name} ${manager.last_name}`}
                    subtitle="Property Manager"
                    phone={manager.phone}
                    email={manager.email}
                    notes={manager.notes}
                    color="blue"
                  />
                ))}
              </div>
            </div>
          )}
        </InfoCard>
      </div>
    </div>
  );
} 
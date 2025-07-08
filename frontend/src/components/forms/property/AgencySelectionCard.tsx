import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import SearchableDropdown from '../../common/SearchableDropdown';
import Label from '../../form/Label';
import Button from '../../ui/button/Button';
import InfoCard from '../../common/InfoCard';
import { Agency, PropertyManager } from '../../../types/property';

interface AgencySelectionCardProps {
  agencies: Agency[];
  selectedAgencyId: number | null;
  onAgencySelect: (agencyId: number | null) => void;
  error?: string;
  disabled?: boolean;
  showManageButton?: boolean;
  manageButtonUrl?: string;
  loading?: boolean;
}

export default function AgencySelectionCard({
  agencies,
  selectedAgencyId,
  onAgencySelect,
  error,
  disabled = false,
  showManageButton = true,
  manageButtonUrl = '/agencies',
  loading = false,
}: AgencySelectionCardProps) {
  const getSelectedAgencyOption = () => {
    if (!selectedAgencyId) return null;
    const agency = agencies.find(a => a.id === selectedAgencyId);
    if (!agency) return null;
    return {
      value: agency.id.toString(),
      label: agency.name
    };
  };

  const selectedAgency = agencies.find(a => a.id === selectedAgencyId);

  return (
    <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-base font-medium text-blue-200 dark:text-blue-200">
          <BuildingOfficeIcon className="w-5 h-5 inline mr-2" />
          Agency Selection
        </Label>
        {showManageButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(manageButtonUrl, '_blank')}
            className="text-xs"
            disabled={disabled}
          >
            Manage Agencies
          </Button>
        )}
      </div>
      
      <SearchableDropdown
        value={getSelectedAgencyOption()}
        onChange={(option) => onAgencySelect(option ? parseInt(option.value) : null)}
        onSearch={async (query) => {
          const filtered = agencies.filter(agency => 
            agency.name.toLowerCase().includes(query.toLowerCase())
          );
          return filtered.map(agency => ({
            value: agency.id.toString(),
            label: agency.name
          }));
        }}
        placeholder="Search agencies..."
        showApplyButton={false}
        showClearButton={true}
        disabled={disabled}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
      
      {/* Property Managers Display */}
      {selectedAgency && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-blue-200">Property Managers</Label>
            <span className="text-sm text-blue-400 font-semibold">
              {selectedAgency.property_managers?.length || 0} {
                (selectedAgency.property_managers?.length || 0) === 1 ? 'manager' : 'managers'
              }
            </span>
          </div>
          
          <div className="space-y-2">
            {selectedAgency.property_managers?.map((manager: PropertyManager) => (
              <InfoCard
                key={manager.id}
                icon={<BuildingOfficeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                title={`${manager.first_name} ${manager.last_name}`}
                subtitle="Property Manager"
                phone={manager.phone}
                email={manager.email}
                notes={manager.notes}
                color="blue"
              />
            )) || (
              <div className="text-blue-400 text-sm py-2 text-center">
                No property managers assigned
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
import { BuildingOfficeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Property } from '../../types/property';

interface PropertyInformationCardProps {
  property: Property;
  loading?: boolean;
}

export default function PropertyInformationCard({ 
  property, 
  loading = false 
}: PropertyInformationCardProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Property Information</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MapPinIcon className="w-4 h-4 text-gray-400" />
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Property Information</h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {property.unit_number ? `Unit ${property.unit_number}, ` : ''}
              {property.street_number} {property.street_name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {property.suburb}, {property.state} {property.postcode}
              {property.country && property.country.trim() !== '' && (
                <span>, {property.country}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import Label from '../form/Label';
import InfoCard from './InfoCard';
import { PrivateOwner } from '../../types/property';

interface PrivateOwnerDisplayCardProps {
  privateOwners: PrivateOwner[];
  loading?: boolean;
}

export default function PrivateOwnerDisplayCard({
  privateOwners,
  loading = false,
}: PrivateOwnerDisplayCardProps) {
  if (loading) {
    return (
      <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-gray-800">
        <div className="text-green-600 dark:text-green-400 text-sm py-4 text-center">
          Loading private owner information...
        </div>
      </div>
    );
  }

  if (!privateOwners || privateOwners.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <Label className="text-base font-medium text-gray-900 dark:text-gray-200">
            Private Owners
          </Label>
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-sm py-4 text-center">
          No private owners assigned to this property
        </div>
      </div>
    );
  }

  return (
    <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-base font-medium text-green-900 dark:text-green-200">
          <UserIcon className="w-5 h-5 inline mr-2" />
          Private Owners
        </Label>
      </div>
      
      <div className="flex justify-end mb-2">
        <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
          {privateOwners.length} {privateOwners.length === 1 ? 'owner' : 'owners'}
        </span>
      </div>
      
      <div className="space-y-2">
        {privateOwners.map((owner) => (
          <InfoCard
            key={owner.id}
            icon={<UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
            title={`${owner.first_name} ${owner.last_name}`}
            subtitle="Private Owner"
            phone={owner.phone}
            email={owner.email}
            notes={owner.notes}
            color="green"
          />
        ))}
      </div>
    </div>
  );
} 
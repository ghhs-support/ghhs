import React from 'react';
import Switch from '../form/switch/Switch';
import { BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';
import Label from '../form/Label';

interface OwnerTypeToggleProps {
  ownerType: 'agency' | 'private';
  onChange: (ownerType: 'agency' | 'private') => void;
  disabled?: boolean;
}

const OwnerTypeToggle: React.FC<OwnerTypeToggleProps> = ({ ownerType, onChange, disabled = false }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <Label className="text-base font-medium mb-3 text-gray-900 dark:text-gray-100">Property Owner Type</Label>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Agency</span>
        </div>
        <Switch
          label=""
          defaultChecked={ownerType === 'private'}
          onChange={(checked) => onChange(checked ? 'private' : 'agency')}
          color="blue"
          disabled={disabled}
        />
        <div className="flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Private Owner</span>
        </div>
      </div>
    </div>
  );
};

export default OwnerTypeToggle; 
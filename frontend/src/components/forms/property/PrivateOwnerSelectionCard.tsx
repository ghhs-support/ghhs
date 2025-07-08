import React, { useState } from 'react';
import { UserIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import SearchableDropdown from '../../common/SearchableDropdown';
import Label from '../../form/Label';
import Button from '../../ui/button/Button';
import InfoCard from '../../common/InfoCard';
import ConfirmModal from '../../common/ConfirmModal';
import { PrivateOwner } from '../../../types/property';

interface PrivateOwnerSelectionCardProps {
  privateOwners: PrivateOwner[];
  selectedOwnerIds: number[];
  onOwnersChange: (ownerIds: number[]) => void;
  error?: string;
  disabled?: boolean;
  showManageButton?: boolean;
  manageButtonUrl?: string;
  loading?: boolean;
}

export default function PrivateOwnerSelectionCard({
  privateOwners,
  selectedOwnerIds,
  onOwnersChange,
  error,
  disabled = false,
  showManageButton = true,
  manageButtonUrl = '/private-owners',
  loading = false,
}: PrivateOwnerSelectionCardProps) {
  const [tempSelectedOwner, setTempSelectedOwner] = useState<{ value: string; label: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<{ id: number; name: string } | null>(null);

  const selectedOwners = privateOwners.filter(owner => selectedOwnerIds.includes(owner.id));

  const handleAddOwner = () => {
    if (tempSelectedOwner && !selectedOwnerIds.includes(parseInt(tempSelectedOwner.value))) {
      const newOwnerIds = [...selectedOwnerIds, parseInt(tempSelectedOwner.value)];
      onOwnersChange(newOwnerIds);
    }
    setTempSelectedOwner(null);
  };

  const openDeleteModal = (owner: PrivateOwner) => {
    setOwnerToDelete({ id: owner.id, name: `${owner.first_name} ${owner.last_name}` });
    setShowDeleteModal(true);
  };

  const handleRemoveOwner = () => {
    if (ownerToDelete) {
      const newOwnerIds = selectedOwnerIds.filter(id => id !== ownerToDelete.id);
      onOwnersChange(newOwnerIds);
    }
    setShowDeleteModal(false);
    setOwnerToDelete(null);
  };

  return (
    <>
      <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-base font-medium text-green-200 dark:text-green-200">
            <UserIcon className="w-5 h-5 inline mr-2" />
            Private Owner Selection
          </Label>
          {showManageButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(manageButtonUrl, '_blank')}
              className="text-xs"
              disabled={disabled}
            >
              Manage Private Owners
            </Button>
          )}
        </div>
        
        {/* Add Private Owner */}
        <div className="mb-4">
          <SearchableDropdown
            value={tempSelectedOwner}
            onChange={(option) => setTempSelectedOwner(option)}
            onSearch={async (query) => {
              const filtered = privateOwners.filter(owner =>
                `${owner.first_name} ${owner.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
                owner.email.toLowerCase().includes(query.toLowerCase()) ||
                owner.phone.includes(query)
              );
              return filtered.map(owner => ({
                value: owner.id.toString(),
                label: `${owner.first_name} ${owner.last_name}`,
                description: `${owner.email} • ${owner.phone}`
              }));
            }}
            placeholder="Search private owners..."
            showApplyButton={false}
            showClearButton={true}
            disabled={disabled}
          />
          
          {/* Add/Cancel buttons */}
          {tempSelectedOwner && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleAddOwner}
                disabled={disabled}
                className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
              >
                <PlusIcon className="w-3 h-3" />
                Add Owner
              </button>
              <button
                type="button"
                onClick={() => setTempSelectedOwner(null)}
                disabled={disabled}
                className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
        
        {/* Selected Private Owners Display */}
        {selectedOwners.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-green-200">
                Selected Owners
              </Label>
              <span className="text-sm text-green-400 font-semibold">
                {selectedOwners.length} {selectedOwners.length === 1 ? 'owner' : 'owners'}
              </span>
            </div>
            
            <div className="space-y-2">
              {selectedOwners.map((owner) => (
                <InfoCard
                  key={owner.id}
                  icon={<UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
                  title={`${owner.first_name} ${owner.last_name}`}
                  subtitle="Private Owner"
                  phone={owner.phone}
                  email={owner.email}
                  notes={owner.notes}
                  color="green"
                  actions={[
                    {
                      icon: <TrashIcon className="w-4 h-4" />,
                      onClick: () => openDeleteModal(owner),
                      title: 'Remove owner',
                      className: 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20',
                    },
                  ]}
                />
              ))}
            </div>
          </div>
        )}
        
        {selectedOwners.length === 0 && (
          <div className="text-green-400 text-sm py-4 text-center">
            No private owners selected
          </div>
        )}
      </div>

      {/* Delete Owner Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleRemoveOwner}
        onCancel={() => {
          setShowDeleteModal(false);
          setOwnerToDelete(null);
        }}
        title="Remove Private Owner?"
        message={`Are you sure you want to remove ${ownerToDelete?.name} from this property? This action cannot be undone.`}
        confirmLabel="Remove Owner"
        cancelLabel="Cancel"
        confirmColor="red"
        loading={loading}
      />
    </>
  );
} 
import React, { useState } from 'react';
import { UserIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import SearchableDropdown from '../common/SearchableDropdown';
import Label from '../form/Label';
import InfoCard from './InfoCard';
import ConfirmModal from '../common/ConfirmModal';
import { Tenant } from '../../types/property';

interface TenantDisplayCardProps {
  tenants: Tenant[];
  onTenantsChange: (tenants: Tenant[]) => void;
  disabled?: boolean;
  loading?: boolean;
  allowAdd?: boolean;
  allowRemove?: boolean;
}

export default function TenantDisplayCard({
  tenants,
  onTenantsChange,
  disabled = false,
  loading = false,
  allowAdd = true,
  allowRemove = true,
}: TenantDisplayCardProps) {
  const [tempSelectedTenant, setTempSelectedTenant] = useState<{ value: string; label: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  const searchTenants = async (query: string) => {
    return [];
  };

  const handleAddTenant = () => {
    if (tempSelectedTenant) {
      const newTenant: Tenant = {
        id: Date.now(),
        first_name: tempSelectedTenant.label.split(' ')[0] || '',
        last_name: tempSelectedTenant.label.split(' ')[1] || '',
        phone: '',
        email: ''
      };
      
      onTenantsChange([...tenants, newTenant]);
    }
    setTempSelectedTenant(null);
  };

  const openDeleteModal = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setShowDeleteModal(true);
  };

  const handleDeleteTenant = () => {
    if (!tenantToDelete) return;

    const updatedTenants = tenants.filter(t => t.id !== tenantToDelete.id);
    onTenantsChange(updatedTenants);
    
    setShowDeleteModal(false);
    setTenantToDelete(null);
  };

  return (
    <>
      <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
        <div className="flex items-center justify-between mb-1">
          <Label className="text-base font-medium text-purple-900 dark:text-purple-200">
            <UserIcon className="w-5 h-5 inline mr-2" />
            Property Tenants
          </Label>
          {allowAdd && (
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Display Only
            </div>
          )}
        </div>
        
        <div className="flex justify-end mb-2">
          <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
            {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}
          </span>
        </div>

        {allowAdd && (
          <div className="mb-4">
            <SearchableDropdown
              value={tempSelectedTenant}
              onChange={(option) => setTempSelectedTenant(option)}
              onSearch={searchTenants}
              placeholder="Search existing tenants to assign..."
              showApplyButton={false}
              showClearButton={true}
              disabled={disabled}
            />
            
            {tempSelectedTenant && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleAddTenant}
                  disabled={disabled}
                  className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
                >
                  <PlusIcon className="w-3 h-3" />
                  Assign Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setTempSelectedTenant(null)}
                  disabled={disabled}
                  className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-2">
          {tenants.length === 0 ? (
            <div className="text-purple-600 dark:text-purple-400 text-sm py-4 text-center">
              No tenants assigned to this property
            </div>
          ) : (
            tenants.map((tenant) => (
              <InfoCard
                key={tenant.id}
                icon={<UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                title={`${tenant.first_name} ${tenant.last_name}`}
                subtitle="Tenant"
                phone={tenant.phone}
                email={tenant.email}
                color="purple"
                actions={allowRemove ? [
                  {
                    icon: <TrashIcon className="w-4 h-4" />,
                    onClick: (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDeleteModal(tenant);
                    },
                    title: 'Remove tenant',
                    className: 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20',
                  },
                ] : []}
              />
            ))
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteTenant}
        onCancel={() => {
          setShowDeleteModal(false);
          setTenantToDelete(null);
        }}
        title="Remove Tenant?"
        message={`Are you sure you want to remove ${tenantToDelete?.first_name} ${tenantToDelete?.last_name} from this property? This action cannot be undone.`}
        confirmLabel="Remove Tenant"
        cancelLabel="Cancel"
        confirmColor="red"
        loading={loading}
      />
    </>
  );
} 
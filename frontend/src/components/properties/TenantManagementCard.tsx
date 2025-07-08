import React, { useState } from 'react';
import { UserIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Label from '../form/Label';
import InputField from '../form/input/InputField';
import InfoCard from './InfoCard';
import ConfirmModal from '../common/ConfirmModal';
import { Tenant } from '../../types/property';

interface TenantManagementCardProps {
  tenants: Tenant[];
  onTenantsChange: (tenants: Tenant[]) => void;
  disabled?: boolean;
  loading?: boolean;
  onTenantUpdate?: (tenant: Tenant) => Promise<void>;
}

interface TenantFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

export default function TenantManagementCard({
  tenants,
  onTenantsChange,
  disabled = false,
  loading = false,
  onTenantUpdate,
}: TenantManagementCardProps) {
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [editingTenant, setEditingTenant] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [tenantErrors, setTenantErrors] = useState<Record<string, string>>({});

  const [newTenant, setNewTenant] = useState<TenantFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  const [editingTenantData, setEditingTenantData] = useState<TenantFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: ''
  });

  const resetTenantForm = () => {
    setNewTenant({
      first_name: '',
      last_name: '',
      phone: '',
      email: ''
    });
    setTenantErrors({});
  };

  const validateTenant = (tenantData: TenantFormData): boolean => {
    const errors: Record<string, string> = {};
    
    if (!tenantData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    if (!tenantData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    if (!tenantData.phone.trim()) {
      errors.phone = 'Phone is required';
    }
    
    setTenantErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTenant(newTenant)) return;

    const tempTenant: Tenant = {
      id: Date.now(),
      first_name: newTenant.first_name,
      last_name: newTenant.last_name,
      phone: newTenant.phone,
      email: newTenant.email || ''
    };

    onTenantsChange([...tenants, tempTenant]);
    setShowAddTenant(false);
    resetTenantForm();
  };

  const startEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant.id);
    setEditingTenantData({
      first_name: tenant.first_name,
      last_name: tenant.last_name,
      phone: tenant.phone,
      email: tenant.email || ''
    });
    setTenantErrors({});
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTenant(editingTenantData) || !editingTenant) return;

    const updatedTenant: Tenant = {
      ...tenants.find(t => t.id === editingTenant)!,
      first_name: editingTenantData.first_name,
      last_name: editingTenantData.last_name,
      phone: editingTenantData.phone,
      email: editingTenantData.email || ''
    };

    const updatedTenants = tenants.map(t => t.id === editingTenant ? updatedTenant : t);
    onTenantsChange(updatedTenants);

    if (onTenantUpdate) {
      try {
        await onTenantUpdate(updatedTenant);
      } catch (error) {
        console.error('Error updating tenant:', error);
      }
    }

    setEditingTenant(null);
    setEditingTenantData({
      first_name: '',
      last_name: '',
      phone: '',
      email: ''
    });
    setTenantErrors({});
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
      <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-1">
          <Label className="text-base font-medium text-purple-900 dark:text-purple-200">
            <UserIcon className="w-5 h-5 inline mr-2" />
            Property Tenants
          </Label>
          <button
            type="button"
            onClick={() => setShowAddTenant(true)}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Add Tenant
          </button>
        </div>
        
        <div className="flex justify-end mb-2">
          <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
            {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}
          </span>
        </div>
        
        <div className="space-y-2">
          {/* Add Tenant Form */}
          {showAddTenant && (
            <div className="p-3 bg-purple-100 dark:bg-gray-700 rounded border border-purple-200 dark:border-gray-600">
              <form onSubmit={handleAddTenant} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-purple-900 dark:text-gray-200">First Name *</Label>
                    <InputField
                      name="first_name"
                      value={newTenant.first_name}
                      onChange={(e) => setNewTenant(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="First name"
                      error={!!tenantErrors.first_name}
                      className="mt-1 text-sm"
                    />
                    {tenantErrors.first_name && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-purple-900 dark:text-gray-200">Last Name *</Label>
                    <InputField
                      name="last_name"
                      value={newTenant.last_name}
                      onChange={(e) => setNewTenant(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Last name"
                      error={!!tenantErrors.last_name}
                      className="mt-1 text-sm"
                    />
                    {tenantErrors.last_name && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.last_name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-purple-900 dark:text-gray-200">Phone *</Label>
                  <InputField
                    name="phone"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    error={!!tenantErrors.phone}
                    className="mt-1 text-sm"
                  />
                  {tenantErrors.phone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.phone}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-purple-900 dark:text-gray-200">Email</Label>
                  <InputField
                    name="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email (optional)"
                    type="email"
                    className="mt-1 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlusIcon className="w-3 h-3" />
                    {loading ? 'Adding...' : 'Add Tenant'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTenant(false);
                      resetTenantForm();
                    }}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Tenant Form */}
          {editingTenant && (
            <div className="p-3 bg-purple-100 dark:bg-gray-700 rounded border border-purple-200 dark:border-gray-600">
              <form onSubmit={handleEditTenant} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-purple-900 dark:text-gray-200">First Name *</Label>
                    <InputField
                      name="first_name"
                      value={editingTenantData.first_name}
                      onChange={(e) => setEditingTenantData(prev => ({ ...prev, first_name: e.target.value }))}
                      placeholder="First name"
                      error={!!tenantErrors.first_name}
                      className="mt-1 text-sm"
                    />
                    {tenantErrors.first_name && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-purple-900 dark:text-gray-200">Last Name *</Label>
                    <InputField
                      name="last_name"
                      value={editingTenantData.last_name}
                      onChange={(e) => setEditingTenantData(prev => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Last name"
                      error={!!tenantErrors.last_name}
                      className="mt-1 text-sm"
                    />
                    {tenantErrors.last_name && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.last_name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-purple-900 dark:text-gray-200">Phone *</Label>
                  <InputField
                    name="phone"
                    value={editingTenantData.phone}
                    onChange={(e) => setEditingTenantData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    error={!!tenantErrors.phone}
                    className="mt-1 text-sm"
                  />
                  {tenantErrors.phone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{tenantErrors.phone}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium text-purple-900 dark:text-gray-200">Email</Label>
                  <InputField
                    name="email"
                    value={editingTenantData.email}
                    onChange={(e) => setEditingTenantData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email (optional)"
                    type="email"
                    className="mt-1 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <PencilIcon className="w-3 h-3" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTenant(null);
                      setEditingTenantData({
                        first_name: '',
                        last_name: '',
                        phone: '',
                        email: ''
                      });
                      setTenantErrors({});
                    }}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Existing Tenants */}
          {tenants.length === 0 && !showAddTenant && !editingTenant ? (
            <div className="text-purple-600 dark:text-purple-400 text-sm py-4 text-center">
              No tenants assigned to this property
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <InfoCard
                  key={tenant.id}
                  icon={<UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  title={`${tenant.first_name} ${tenant.last_name}`}
                  subtitle="Tenant"
                  phone={tenant.phone}
                  email={tenant.email}
                  color="purple"
                  actions={[
                    {
                      icon: <PencilIcon className="w-4 h-4" />,
                      onClick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startEditTenant(tenant);
                      },
                      title: 'Edit tenant',
                      className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20',
                    },
                    {
                      icon: <TrashIcon className="w-4 h-4" />,
                      onClick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDeleteModal(tenant);
                      },
                      title: 'Delete tenant',
                      className: 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20',
                    },
                  ]}
                />
              ))}
            </div>
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
        title="Delete Tenant?"
        message={`Are you sure you want to delete the tenant ${tenantToDelete?.first_name} ${tenantToDelete?.last_name}? This action cannot be undone.`}
        confirmLabel="Delete Tenant"
        cancelLabel="Cancel"
        confirmColor="red"
        loading={loading}
      />
    </>
  );
} 
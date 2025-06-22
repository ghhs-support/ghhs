import { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';

interface Tenant {
  name: string;
  phone: string;
}

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenants: Tenant[]) => void;
  initialTenants?: Tenant[];
}

export default function TenantModal({ isOpen, onClose, onSave, initialTenants = [] }: TenantModalProps) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants.length > 0 ? initialTenants : [{ name: '', phone: '' }]);

  // Reset tenants when initialTenants changes
  useEffect(() => {
    setTenants(initialTenants.length > 0 ? initialTenants : [{ name: '', phone: '' }]);
  }, [initialTenants]);

  const handleAddTenant = () => {
    setTenants([...tenants, { name: '', phone: '' }]);
  };

  const handleRemoveTenant = (index: number) => {
    setTenants(tenants.filter((_, i) => i !== index));
  };

  const handleTenantChange = (index: number, field: keyof Tenant, value: string) => {
    const newTenants = [...tenants];
    newTenants[index] = { ...newTenants[index], [field]: value };
    setTenants(newTenants);
  };

  const handleSave = () => {
    // Filter out empty tenant entries
    const validTenants = tenants.filter(tenant => tenant.name.trim() !== '' || tenant.phone.trim() !== '');
    onSave(validTenants);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div>
          <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
            Manage Tenants
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add or remove tenants and their contact information
          </p>
        </div>

        <div className="space-y-4">
          {tenants.map((tenant, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-start">
              <div className="space-y-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tenant Name
                </label>
                <input
                  type="text"
                  value={tenant.name}
                  onChange={(e) => handleTenantChange(index, 'name', e.target.value)}
                  placeholder="Enter tenant name"
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div className="space-y-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={tenant.phone}
                  onChange={(e) => handleTenantChange(index, 'phone', e.target.value)}
                  placeholder="Enter phone number"
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              {tenants.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTenant(index)}
                  className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 w-full sm:w-auto mt-6"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddTenant}
            className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 w-full sm:w-auto"
          >
            Add Another Tenant
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Save Tenants
          </button>
        </div>
      </div>
    </Modal>
  );
} 
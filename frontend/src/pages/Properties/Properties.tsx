import { useState } from 'react';
import Button from '../../components/ui/button/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import PropertiesTable from '../../components/properties/PropertiesTable';
import CreatePropertyForm from '../../components/properties/CreatePropertyForm';

export default function Properties() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const handleCreateSuccess = () => {
    // Handle success actions like refreshing the table
    console.log('Property created successfully');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Properties</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all properties in the system</p>
      </div>

      <div className="mb-4">
        <Button
          onClick={handleOpenCreateModal}
          startIcon={<PlusIcon className="w-5 h-5" />}
        >
          Add Property
        </Button>
      </div>

      <PropertiesTable />

      <CreatePropertyForm
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
} 
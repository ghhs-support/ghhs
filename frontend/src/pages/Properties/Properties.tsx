import { useState } from 'react';
import Button from '../../components/ui/button/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import PropertiesTable from '../../components/properties/PropertiesTable';
import PropertiesFiltersCard from '../../components/properties/PropertiesFiltersCard';
import CreatePropertyForm from '../../components/properties/CreatePropertyForm';

export default function Properties() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    address: null as string | null,
    suburb: null as string | null,
    state: null as string | null,
    postcode: null as string | null,
    isAgency: null as boolean | null,
    isPrivate: null as boolean | null,
    isActive: null as boolean | null,
    agency: null as string | null,
  });

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  const handleCreateSuccess = () => {
    console.log('Property created successfully');
  };

  // Filter handlers
  const handleAddressChange = (address: string | null) => {
    setFilters(prev => ({ ...prev, address }));
  };

  const handleSuburbChange = (suburb: string | null) => {
    setFilters(prev => ({ ...prev, suburb }));
  };

  const handleStateChange = (state: string | null) => {
    setFilters(prev => ({ ...prev, state }));
  };

  const handlePostcodeChange = (postcode: string | null) => {
    setFilters(prev => ({ ...prev, postcode }));
  };

  const handleIsAgencyChange = (isAgency: boolean | null) => {
    setFilters(prev => ({ ...prev, isAgency }));
  };

  const handleIsPrivateChange = (isPrivate: boolean | null) => {
    setFilters(prev => ({ ...prev, isPrivate }));
  };

  const handleIsActiveChange = (isActive: boolean | null) => {
    setFilters(prev => ({ ...prev, isActive }));
  };

  const handleAgencyChange = (agency: string | null) => {
    setFilters(prev => ({ ...prev, agency }));
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

      <div className="mb-6">
        <PropertiesFiltersCard
          onAddressChange={handleAddressChange}
          onSuburbChange={handleSuburbChange}
          onStateChange={handleStateChange}
          onPostcodeChange={handlePostcodeChange}
          onIsAgencyChange={handleIsAgencyChange}
          onIsPrivateChange={handleIsPrivateChange}
          onIsActiveChange={handleIsActiveChange}
          onAgencyChange={handleAgencyChange}
          currentAddress={filters.address}
          currentSuburb={filters.suburb}
          currentState={filters.state}
          currentPostcode={filters.postcode}
          currentIsAgency={filters.isAgency}
          currentIsPrivate={filters.isPrivate}
          currentIsActive={filters.isActive}
          currentAgency={filters.agency}
        />
      </div>

      <PropertiesTable filters={filters} />

      <CreatePropertyForm
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
} 
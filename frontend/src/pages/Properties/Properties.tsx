import { useState } from 'react';
import Button from '../../components/ui/button/Button';
import { PlusIcon } from '@heroicons/react/24/outline';
import PropertiesTable from '../../components/properties/PropertiesTable';
import { Modal } from '../../components/ui/modal';
import CreatePropertyForm from '../../components/properties/CreatePropertyForm';

export default function Properties() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Properties</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all properties in the system</p>
      </div>

      <div className="mb-4">
        <Button
          onClick={handleOpenModal}
          startIcon={<PlusIcon className="w-5 h-5" />}
        >
          Add Property
        </Button>
      </div>

      <PropertiesTable />

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} size="lg">
        <Modal.Header onClose={handleCloseModal}>
          Create a New Property
        </Modal.Header>
        <Modal.Body>
          <CreatePropertyForm
            onSuccess={handleCloseModal}
            onCancel={handleCloseModal}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleCloseModal}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
} 
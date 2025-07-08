import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/button/Button';
import { Modal } from '../ui/modal';

interface CreatePropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePropertyForm: React.FC<CreatePropertyFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    setTimeout(() => {
      toast.success('Property created successfully! (placeholder)');
      setFormLoading(false);
      onClose();
      onSuccess();
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header onClose={onClose}>Create Property</Modal.Header>
      <Modal.Body>
        <form id="create-property-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Form fields will be added here...</p>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={formLoading}
        >
          Cancel
        </Button>
        <button
          type="submit"
          form="create-property-form"
          disabled={formLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-700 dark:text-white"
        >
          {formLoading ? 'Creating...' : 'Create Property'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePropertyForm;


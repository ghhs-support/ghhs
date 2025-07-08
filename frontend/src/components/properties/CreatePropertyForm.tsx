import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/button/Button';
import AddressForm from '../common/AddressForm';
import OwnerTypeToggle from '../common/OwnerTypeToggle';
import { Modal } from '../ui/modal';

interface CreatePropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePropertyForm: React.FC<CreatePropertyFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    unit_number: '',
    street_number: '',
    street_name: '',
    suburb: '',
    state: '',
    postcode: '',
    country: '',
    latitude: '',
    longitude: '',
  });
  const [ownerType, setOwnerType] = useState<'agency' | 'private'>('agency');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.street_number.trim()) {
      newErrors.street_number = 'Street number is required';
    }
    if (!formData.street_name.trim()) {
      newErrors.street_name = 'Street name is required';
    }
    if (!formData.suburb.trim()) {
      newErrors.suburb = 'Suburb is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setFormLoading(true);
    console.log('Form data:', { ...formData, ownerType });
    
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
          <AddressForm 
            formData={formData} 
            onChange={handleChange} 
            errors={formErrors}
          />
          
          <OwnerTypeToggle
            ownerType={ownerType}
            onChange={setOwnerType}
            disabled={formLoading}
          />
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


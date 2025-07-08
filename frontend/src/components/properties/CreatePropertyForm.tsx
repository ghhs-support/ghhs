import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/button/Button';
import AddressForm from '../common/AddressForm';

interface CreatePropertyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreatePropertyForm: React.FC<CreatePropertyFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    unit_number: '',
    street_number: '',
    street_name: '',
    suburb: '',
    state: '',
    postcode: '',
    country: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
    toast.success('Property created successfully! (placeholder)');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6.5">
      <AddressForm formData={formData} onChange={handleChange} />

      <div className="flex justify-end gap-3 mt-6">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Create Property
        </Button>
      </div>
    </form>
  );
};

export default CreatePropertyForm;



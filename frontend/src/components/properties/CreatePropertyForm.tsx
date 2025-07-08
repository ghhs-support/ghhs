import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/button/Button';
import AddressForm from '../common/AddressForm';
import Switch from '../form/switch/Switch';
import { BuildingOfficeIcon, UserIcon } from '@heroicons/react/24/outline';
import Label from '../form/Label';

interface CreatePropertyFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreatePropertyForm: React.FC<CreatePropertyFormProps> = ({ onSuccess, onCancel }) => {
  const [ownerType, setOwnerType] = useState<'agency' | 'private'>('agency');
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
    console.log({ ...formData, ownerType });
    toast.success('Property created successfully! (placeholder)');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="p-6.5">
      <AddressForm formData={formData} onChange={handleChange} />

      {/* Owner Type Toggle */}
      <div className="rounded-lg p-4 bg-[#1C2537] mt-4">
        <Label className="text-base font-medium text-white mb-3">Property Owner Type</Label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-300">Agency</span>
          </div>
          <Switch
            label=""
            defaultChecked={ownerType === 'private'}
            onChange={(checked) => setOwnerType(checked ? 'private' : 'agency')}
            color="blue"
          />
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-300">Private Owner</span>
          </div>
        </div>
      </div>

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



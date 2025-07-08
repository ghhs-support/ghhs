import React, { useState } from 'react';
import InputField from '../form/input/InputField';

interface AddressFormData {
  unit_number: string;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

interface AddressFormProps {
  formData: AddressFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ formData, onChange }) => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="mb-6">
      <div className="mb-4">
        <InputField
          label="Search Address"
          name="address_search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search for an address..."
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <InputField
          label="Unit Number"
          name="unit_number"
          value={formData.unit_number}
          onChange={onChange}
          placeholder="e.g. 1A"
          optional
        />
        <InputField
          label="Street Number"
          name="street_number"
          value={formData.street_number}
          onChange={onChange}
          placeholder="e.g. 123"
          required
        />
      </div>

      <div className="mb-4">
        <InputField
          label="Street Name"
          name="street_name"
          value={formData.street_name}
          onChange={onChange}
          placeholder="e.g. Main Street"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <InputField
          label="Suburb"
          name="suburb"
          value={formData.suburb}
          onChange={onChange}
          placeholder="e.g. Sydney"
          required
        />
        <InputField
          label="State"
          name="state"
          value={formData.state}
          onChange={onChange}
          placeholder="e.g. NSW"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField
          label="Postcode"
          name="postcode"
          value={formData.postcode}
          onChange={onChange}
          placeholder="e.g. 2000"
          required
        />
        <InputField
          label="Country"
          name="country"
          value={formData.country}
          onChange={onChange}
          placeholder="e.g. Australia"
          required
        />
      </div>
    </div>
  );
};

export default AddressForm; 
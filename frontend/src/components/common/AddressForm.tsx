import React, { useState } from 'react';
import InputField from '../form/input/InputField';
import Label from '../form/Label';

interface AddressFormData {
  unit_number: string;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  latitude?: string;
  longitude?: string;
}

interface AddressFormProps {
  formData: AddressFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ formData, onChange }) => {
  const [searchValue, setSearchValue] = useState('');

  // Placeholder for future Google Places implementation
  const handlePlacesSearch = (value: string) => {
    setSearchValue(value);
    // TODO: Implement Google Places API search
    // This will later:
    // 1. Search for addresses
    // 2. When an address is selected, populate all fields including lat/long
    // 3. Enable auto-complete
  };

  return (
    <div className="rounded-lg p-4 bg-[#1C2537]">
      <Label className="text-base font-medium mb-3 text-white">Property Address</Label>
      
      {/* Google Places Search Field */}
      <div className="mb-6">
        <Label htmlFor="address_search" className="text-sm font-medium text-gray-300">Search Address</Label>
        <InputField
          id="address_search"
          name="address_search"
          value={searchValue}
          onChange={(e) => handlePlacesSearch(e.target.value)}
          placeholder="Search for an address..."
          className="mt-1 bg-[#101828]"
        />
        <p className="mt-1 text-xs text-gray-400">Search for an address to auto-fill the fields below</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="unit_number" className="text-sm font-medium text-gray-300">Unit Number</Label>
          <InputField
            id="unit_number"
            value={formData.unit_number}
            onChange={onChange}
            placeholder="e.g. 1A"
            className="mt-1 bg-[#101828]"
            optional
          />
        </div>
        <div>
          <Label htmlFor="street_number" className="text-sm font-medium text-gray-300">Street Number *</Label>
          <InputField
            id="street_number"
            value={formData.street_number}
            onChange={onChange}
            placeholder="e.g. 123"
            className="mt-1 bg-[#101828]"
            required
          />
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="street_name" className="text-sm font-medium text-gray-300">Street Name *</Label>
        <InputField
          id="street_name"
          value={formData.street_name}
          onChange={onChange}
          placeholder="e.g. Main Street"
          className="mt-1 bg-[#101828]"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="suburb" className="text-sm font-medium text-gray-300">Suburb *</Label>
          <InputField
            id="suburb"
            value={formData.suburb}
            onChange={onChange}
            placeholder="e.g. Sydney"
            className="mt-1 bg-[#101828]"
            required
          />
        </div>
        <div>
          <Label htmlFor="state" className="text-sm font-medium text-gray-300">State *</Label>
          <InputField
            id="state"
            value={formData.state}
            onChange={onChange}
            placeholder="e.g. NSW"
            className="mt-1 bg-[#101828]"
            required
          />
        </div>
        <div>
          <Label htmlFor="postcode" className="text-sm font-medium text-gray-300">Postcode *</Label>
          <InputField
            id="postcode"
            value={formData.postcode}
            onChange={onChange}
            placeholder="e.g. 2000"
            className="mt-1 bg-[#101828]"
            required
          />
        </div>
      </div>

      {/* Hidden Latitude/Longitude Fields */}
      <div className="hidden">
        <InputField
          id="latitude"
          name="latitude"
          value={formData.latitude || ''}
          onChange={onChange}
          type="text"
        />
        <InputField
          id="longitude"
          name="longitude"
          value={formData.longitude || ''}
          onChange={onChange}
          type="text"
        />
      </div>
    </div>
  );
};

export default AddressForm; 
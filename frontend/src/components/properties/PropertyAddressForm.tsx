import React from 'react';
import Label from '../form/Label';
import InputField from '../form/input/InputField';

interface PropertyAddressFormProps {
  formData: {
    unit_number: string;
    street_number: string;
    street_name: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
    latitude: string;
    longitude: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

const PropertyAddressForm: React.FC<PropertyAddressFormProps> = ({ 
  formData, 
  onChange, 
  errors, 
  disabled = false 
}) => {
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
          Property Address
        </Label>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit_number">Unit Number</Label>
          <InputField
            id="unit_number"
            name="unit_number"
            type="text"
            value={formData.unit_number}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., 12A"
            className="mt-1"
          />
          {errors.unit_number && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit_number}</p>
          )}
        </div>

        <div>
          <Label htmlFor="street_number">Street Number *</Label>
          <InputField
            id="street_number"
            name="street_number"
            type="text"
            value={formData.street_number}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., 123"
            className="mt-1"
          />
          {errors.street_number && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street_number}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="street_name">Street Name *</Label>
          <InputField
            id="street_name"
            name="street_name"
            type="text"
            value={formData.street_name}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., Main Street"
            className="mt-1"
          />
          {errors.street_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street_name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="suburb">Suburb *</Label>
          <InputField
            id="suburb"
            name="suburb"
            type="text"
            value={formData.suburb}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., Melbourne"
            className="mt-1"
          />
          {errors.suburb && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.suburb}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">State *</Label>
          <InputField
            id="state"
            name="state"
            type="text"
            value={formData.state}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., VIC"
            className="mt-1"
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state}</p>
          )}
        </div>

        <div>
          <Label htmlFor="postcode">Postcode *</Label>
          <InputField
            id="postcode"
            name="postcode"
            type="text"
            value={formData.postcode}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., 3000"
            className="mt-1"
          />
          {errors.postcode && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.postcode}</p>
          )}
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <InputField
            id="country"
            name="country"
            type="text"
            value={formData.country}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., Australia"
            className="mt-1"
          />
          {errors.country && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.country}</p>
          )}
        </div>

        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <InputField
            id="latitude"
            name="latitude"
            type="text"
            value={formData.latitude}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., -37.8136"
            className="mt-1"
          />
          {errors.latitude && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.latitude}</p>
          )}
        </div>

        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <InputField
            id="longitude"
            name="longitude"
            type="text"
            value={formData.longitude}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., 144.9631"
            className="mt-1"
          />
          {errors.longitude && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.longitude}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyAddressForm; 
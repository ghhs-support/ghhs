import React, { useRef } from 'react';
import Label from '../form/Label';
import InputField from '../form/input/InputField';
import SearchableDropdown from '../common/SearchableDropdown';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete';
import { AUSTRALIAN_STATES } from '../../types/address';

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
  disabled = false,
}) => {
  const addressSearchRef = useRef<HTMLInputElement>(null);
  const [addressSearchValue, setAddressSearchValue] = React.useState('');

  const { suggestions, loading: searchLoading, searchAddress, selectAddress } = useAddressAutocomplete({
    onAddressSelected: (parsedAddress) => {
      const fields = [
        { name: 'unit_number', value: parsedAddress.unit_number },
        { name: 'street_number', value: parsedAddress.street_number },
        { name: 'street_name', value: parsedAddress.street_name },
        { name: 'suburb', value: parsedAddress.suburb },
        { name: 'state', value: parsedAddress.state },
        { name: 'postcode', value: parsedAddress.postcode },
        { name: 'country', value: parsedAddress.country },
        { name: 'latitude', value: parsedAddress.latitude.toString() },
        { name: 'longitude', value: parsedAddress.longitude.toString() },
      ];

      fields.forEach(field => {
        onChange({
          target: { name: field.name, value: field.value }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      setAddressSearchValue('');
    },
  });

  const currentStateOption = formData.state
    ? AUSTRALIAN_STATES.find(state => state.value === formData.state) || { value: formData.state, label: formData.state }
    : null;

  const handleAddressSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddressSearchValue(value);
    if (value.length > 2) {
      searchAddress(value);
    }
  };

  const handleStateChange = (option: { value: string; label: string } | null) => {
    onChange({
      target: { name: 'state', value: option ? option.value : '' }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <Label className="text-base font-medium mb-3 text-gray-900 dark:text-gray-100">Property Address</Label>
      <div className="space-y-4">
        <div>
          <Label htmlFor="address_search" className="text-gray-700 dark:text-gray-300">
            Search Address
          </Label>
          <div className="relative">
            <InputField
              id="address_search"
              name="address_search"
              type="text"
              value={addressSearchValue}
              onChange={handleAddressSearch}
              disabled={disabled}
              placeholder="Start typing an address..."
              className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchLoading && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 dark:border-blue-400"></div>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg dark:shadow-gray-900/20 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                    onClick={() => selectAddress(suggestion)}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {suggestion.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="unit_number" className="text-gray-700 dark:text-gray-300">Unit Number</Label>
            <InputField
              id="unit_number"
              name="unit_number"
              type="text"
              value={formData.unit_number}
              onChange={onChange}
              disabled={disabled}
              placeholder="e.g., 12A"
              className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {errors.unit_number && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.unit_number}</p>
            )}
          </div>

          <div>
            <Label htmlFor="street_number" className="text-gray-700 dark:text-gray-300">Street Number *</Label>
            <InputField
              id="street_number"
              name="street_number"
              type="text"
              value={formData.street_number}
              onChange={onChange}
              disabled={disabled}
              placeholder="e.g., 123"
              className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {errors.street_number && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street_number}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="street_name" className="text-gray-700 dark:text-gray-300">Street Name *</Label>
          <InputField
            id="street_name"
            name="street_name"
            type="text"
            value={formData.street_name}
            onChange={onChange}
            disabled={disabled}
            placeholder="e.g., Collins Street"
            className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          {errors.street_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street_name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="suburb" className="text-gray-700 dark:text-gray-300">Suburb *</Label>
            <InputField
              id="suburb"
              name="suburb"
              type="text"
              value={formData.suburb}
              onChange={onChange}
              disabled={disabled}
              placeholder="e.g., Melbourne"
              className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {errors.suburb && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.suburb}</p>
            )}
          </div>

          <div>
            <SearchableDropdown
              options={AUSTRALIAN_STATES}
              value={currentStateOption}
              onChange={handleStateChange}
              placeholder="Type or select state..."
              label="State *"
              showApplyButton={false}
              showClearButton={true}
              includeAllOption={false}
              disabled={disabled}
              className="mt-1"
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.state}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postcode" className="text-gray-700 dark:text-gray-300">Postcode *</Label>
            <InputField
              id="postcode"
              name="postcode"
              type="text"
              value={formData.postcode}
              onChange={onChange}
              disabled={disabled}
              placeholder="e.g., 3000"
              className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {errors.postcode && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.postcode}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country" className="text-gray-700 dark:text-gray-300">Country *</Label>
            <InputField
              id="country"
              name="country"
              type="text"
              value={formData.country}
              onChange={onChange}
              disabled={disabled}
              placeholder="e.g., Australia"
              className="mt-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.country}</p>
            )}
          </div>
        </div>

        <input type="hidden" name="latitude" value={formData.latitude} />
        <input type="hidden" name="longitude" value={formData.longitude} />
      </div>
    </div>
  );
};

export default PropertyAddressForm; 
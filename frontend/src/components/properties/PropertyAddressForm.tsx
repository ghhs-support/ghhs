import React, { useEffect, useRef } from 'react';
import Label from '../form/Label';
import InputField from '../form/input/InputField';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete';

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
  const [searchTerm, setSearchTerm] = React.useState('');

  // Google API hook - handles all address search logic internally
  const { suggestions, loading: searchLoading, searchAddress, selectAddress } = useAddressAutocomplete({
    onAddressSelected: (parsedAddress) => {
      // Update parent form by simulating onChange events
      const fields = [
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
        onChange({ target: { name: field.name, value: field.value } } as any);
      });
    }
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Call Google API search directly
    if (value.trim()) {
      searchAddress(value.trim());
    }
  };

  const handleSuggestionSelect = (suggestion: any) => {
    selectAddress(suggestion);
    setSearchTerm(suggestion.description);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
          Property Address
        </Label>
      </div>
      
      {/* Address Search Field */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Address (Optional)
        </Label>
        <div className="relative">
          <InputField
            id="address_search"
            name="address_search"
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            disabled={disabled}
            placeholder="Start typing an address to search..."
            className="w-full pr-20"
          />
          
          {/* Loading indicator */}
          {searchLoading && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          )}
          
          {/* Clear button */}
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              disabled={disabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Search results will auto-populate the fields below
          </p>
          {searchLoading && (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Searching...
            </p>
          )}
        </div>
      </div>
      
      {/* Form Fields */}
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
            className="mt-1"
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
            className="mt-1"
          />
          {errors.street_number && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street_number}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="street_name" className="text-gray-700 dark:text-gray-300">Street Name *</Label>
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
          <Label htmlFor="suburb" className="text-gray-700 dark:text-gray-300">Suburb *</Label>
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
          <Label htmlFor="state" className="text-gray-700 dark:text-gray-300">State *</Label>
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
          <Label htmlFor="postcode" className="text-gray-700 dark:text-gray-300">Postcode *</Label>
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
          <Label htmlFor="country" className="text-gray-700 dark:text-gray-300">Country</Label>
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

        {/* Hidden fields for latitude and longitude */}
        <input type="hidden" name="latitude" value={formData.latitude} />
        <input type="hidden" name="longitude" value={formData.longitude} />
      </div>
    </div>
  );
};

export default PropertyAddressForm; 
// services/googleApi.ts
import { GoogleAutocompleteResponse, GooglePlaceDetails, ParsedAddress } from '../types/google';

const API_BASE_URL = 'http://localhost:8000/api';

export const googleApiService = {
  async getAddressSuggestions(input: string, countryCode: string = 'AU'): Promise<GoogleAutocompleteResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/common/address/autocomplete/?input=${encodeURIComponent(input)}&country_code=${countryCode}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      throw error;
    }
  },

  // Get full details when user selects an address
  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/common/address/details/?place_id=${encodeURIComponent(placeId)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch place details');
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error fetching place details:', error);
      throw error;
    }
  },

  // Parse Google response into your form format
  parseAddressComponents(placeDetails: GooglePlaceDetails): ParsedAddress {
    const components = placeDetails.address_components;
    
    const getComponent = (types: string[]) => {
      const component = components.find(comp => 
        types.some(type => comp.types.includes(type))
      );
      return component?.long_name || '';
    };

    return {
      street_number: getComponent(['street_number']),
      street_name: getComponent(['route']),
      suburb: getComponent(['locality', 'sublocality']),
      state: getComponent(['administrative_area_level_1']),
      postcode: getComponent(['postal_code']),
      country: getComponent(['country']),
      latitude: placeDetails.geometry.location.lat,
      longitude: placeDetails.geometry.location.lng,
    };
  }
};

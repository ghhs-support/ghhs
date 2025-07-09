// hooks/useAddressAutocomplete.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleAutocompletePrediction, ParsedAddress } from '../types/google';
import { useAuthenticatedApi } from './useAuthenticatedApi';

interface UseAddressAutocompleteProps {
  onAddressSelected?: (parsedAddress: ParsedAddress) => void;
  debounceMs?: number;
  countryCode?: string;
}

// Map Google's full state names to Australian abbreviations
const mapToAustralianStateCode = (stateName: string): string => {
  if (!stateName) return '';
  
  const stateMapping: { [key: string]: string } = {
    // Full names
    'New South Wales': 'NSW',
    'Victoria': 'VIC',
    'Queensland': 'QLD',
    'Western Australia': 'WA',
    'South Australia': 'SA',
    'Tasmania': 'TAS',
    'Australian Capital Territory': 'ACT',
    'Northern Territory': 'NT',
    // Abbreviations (in case Google returns these)
    'NSW': 'NSW',
    'VIC': 'VIC', 
    'QLD': 'QLD',
    'WA': 'WA',
    'SA': 'SA',
    'TAS': 'TAS',
    'ACT': 'ACT',
    'NT': 'NT',
    // Common variations
    'Qld': 'QLD',
    'Vic': 'VIC',
    'Nsw': 'NSW',
  };
  
  const mapped = stateMapping[stateName];
  console.log(`🗺️ Mapping "${stateName}" to "${mapped}"`);
  return mapped || stateName;
};

export const useAddressAutocomplete = ({
  onAddressSelected,
  debounceMs = 300,
  countryCode = 'AU'
}: UseAddressAutocompleteProps = {}) => {
  
  const { authenticatedGet } = useAuthenticatedApi();
  
  const [suggestions, setSuggestions] = useState<GoogleAutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GoogleAutocompletePrediction | null>(null);
  
  const searchTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const searchAddress = useCallback((input: string) => {
    cleanup();
    
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await authenticatedGet(
          `/common/address/autocomplete/?input=${encodeURIComponent(input)}&country_code=${countryCode}`
        );
        
        if (data.status === 'OK') {
          setSuggestions(data.predictions || []);
        } else {
          setSuggestions([]);
          setError('No suggestions found');
        }
      } catch (err: any) {
        setError('Failed to fetch suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [countryCode, debounceMs, cleanup, authenticatedGet]);

  const selectAddress = useCallback(async (prediction: GoogleAutocompletePrediction) => {
    setSelectedSuggestion(prediction);
    setLoading(true);
    setError(null);
    
    try {
      const placeDetails = await authenticatedGet(
        `/common/address/details/?place_id=${encodeURIComponent(prediction.place_id)}`
      );
      
      const components = placeDetails.result.address_components;
      
      // Debug logging
      console.log('🗺️ All address components:', components);
      components.forEach((comp: any, index: number) => {
        console.log(`Component ${index}:`, comp.long_name, '- Types:', comp.types);
      });
      
      const getComponent = (types: string[]) => {
        const component = components.find((comp: any) => 
          types.some(type => comp.types.includes(type))
        );
        return component?.long_name || '';
      };

      const streetNumber = getComponent(['street_number']);
      const streetName = getComponent(['route']);
      const rawState = getComponent(['administrative_area_level_1']);
      
      console.log('🏛️ Raw state from Google:', rawState);
      console.log('🔄 Mapped state:', mapToAustralianStateCode(rawState));
      
      let unitNumber = '';
      
      const unitComponent = components.find((comp: any) => 
        comp.types.includes('subpremise') || 
        comp.types.includes('floor') ||
        comp.long_name.toLowerCase().includes('unit') ||
        comp.long_name.toLowerCase().includes('apt') ||
        comp.long_name.toLowerCase().includes('suite')
      );
      
      if (unitComponent) {
        unitNumber = unitComponent.long_name.replace(/^(unit|apt|apartment|suite|floor)\s*/i, '');
      }

      const parsedAddress = {
        unit_number: unitNumber,
        street_number: streetNumber,
        street_name: streetName,
        suburb: getComponent(['locality', 'sublocality']),
        state: mapToAustralianStateCode(rawState),
        postcode: getComponent(['postal_code']),
        country: getComponent(['country']) || 'Australia',
        latitude: placeDetails.result.geometry.location.lat,
        longitude: placeDetails.result.geometry.location.lng,
      };
      
      console.log('🏠 Final parsed address:', parsedAddress);
      console.log('🏛️ Final state value:', parsedAddress.state);
      
      if (onAddressSelected) {
        onAddressSelected(parsedAddress);
      }
      
      setSuggestions([]);
      
    } catch (err: any) {
      setError('Failed to get address details');
    } finally {
      setLoading(false);
    }
  }, [onAddressSelected, authenticatedGet]);

  const clearSuggestions = useCallback(() => {
    cleanup();
    setSuggestions([]);
    setSelectedSuggestion(null);
    setError(null);
    setLoading(false);
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    suggestions,
    loading,
    error,
    selectedSuggestion,
    searchAddress,
    selectAddress,
    clearSuggestions
  };
};

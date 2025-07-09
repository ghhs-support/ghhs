// hooks/useAddressAutocomplete.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleAutocompletePrediction, ParsedAddress } from '../types/google';
import { useAuthenticatedApi } from './useAuthenticatedApi';

interface UseAddressAutocompleteProps {
  onAddressSelected?: (parsedAddress: ParsedAddress) => void;
  debounceMs?: number;
  countryCode?: string;
}

export const useAddressAutocomplete = ({
  onAddressSelected,
  debounceMs = 300,
  countryCode = 'AU'
}: UseAddressAutocompleteProps = {}) => {
  
  // Use your existing authenticated API hook
  const { authenticatedGet } = useAuthenticatedApi();
  
  // State management
  const [suggestions, setSuggestions] = useState<GoogleAutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GoogleAutocompletePrediction | null>(null);
  
  // Refs for cleanup
  const searchTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
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

  // Search addresses with debouncing
  const searchAddress = useCallback((input: string) => {
    cleanup();
    
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    // Debounce the search
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
        console.error('Error fetching address suggestions:', err);
        setError('Failed to fetch suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [countryCode, debounceMs, cleanup, authenticatedGet]);

  // Select address and get details
  const selectAddress = useCallback(async (prediction: GoogleAutocompletePrediction) => {
    setSelectedSuggestion(prediction);
    setLoading(true);
    setError(null);
    
    try {
      const placeDetails = await authenticatedGet(
        `/common/address/details/?place_id=${encodeURIComponent(prediction.place_id)}`
      );
      
      // Parse address components
      const components = placeDetails.result.address_components;
      
      const getComponent = (types: string[]) => {
        const component = components.find((comp: any) => 
          types.some(type => comp.types.includes(type))
        );
        return component?.long_name || '';
      };

      const parsedAddress = {
        street_number: getComponent(['street_number']),
        street_name: getComponent(['route']),
        suburb: getComponent(['locality', 'sublocality']),
        state: getComponent(['administrative_area_level_1']),
        postcode: getComponent(['postal_code']),
        country: getComponent(['country']),
        latitude: placeDetails.result.geometry.location.lat,
        longitude: placeDetails.result.geometry.location.lng,
      };
      
      if (onAddressSelected) {
        onAddressSelected(parsedAddress);
      }
      
      setSuggestions([]);
      
    } catch (err: any) {
      console.error('Error getting place details:', err);
      setError('Failed to get address details');
    } finally {
      setLoading(false);
    }
  }, [onAddressSelected, authenticatedGet]);

  // Clear all state
  const clearSuggestions = useCallback(() => {
    cleanup();
    setSuggestions([]);
    setSelectedSuggestion(null);
    setError(null);
    setLoading(false);
  }, [cleanup]);

  // Cleanup on unmount
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

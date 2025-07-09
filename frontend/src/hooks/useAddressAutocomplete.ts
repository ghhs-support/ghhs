// hooks/useAddressAutocomplete.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { googleApiService } from '../services/googleApi';
import { GoogleAutocompletePrediction, ParsedAddress } from '../types/google';

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
  
  // State management (same pattern as your useModal)
  const [suggestions, setSuggestions] = useState<GoogleAutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<GoogleAutocompletePrediction | null>(null);
  
  // Refs for cleanup (similar to your form patterns)
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

  // Search addresses with debouncing (similar to your form validation pattern)
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
        abortControllerRef.current = new AbortController();
        const data = await googleApiService.getAddressSuggestions(input, countryCode);
        
        if (data.status === 'OK') {
          setSuggestions(data.predictions || []);
        } else {
          setSuggestions([]);
          setError('No suggestions found');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching address suggestions:', err);
          setError('Failed to fetch suggestions');
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }, debounceMs);
  }, [countryCode, debounceMs, cleanup]);

  // Select address and get details (similar to your form submission pattern)
  const selectAddress = useCallback(async (prediction: GoogleAutocompletePrediction) => {
    setSelectedSuggestion(prediction);
    setLoading(true);
    setError(null);
    
    try {
      const placeDetails = await googleApiService.getPlaceDetails(prediction.place_id);
      const parsedAddress = googleApiService.parseAddressComponents(placeDetails);
      
      // Call the callback if provided (similar to your onSuccess pattern)
      if (onAddressSelected) {
        onAddressSelected(parsedAddress);
      }
      
      // Clear suggestions after selection
      setSuggestions([]);
      
    } catch (err: any) {
      console.error('Error getting place details:', err);
      setError('Failed to get address details');
    } finally {
      setLoading(false);
    }
  }, [onAddressSelected]);

  // Clear all state (similar to your form reset pattern)
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

  // Return state and actions (same pattern as your useModal)
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

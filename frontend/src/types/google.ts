export interface GoogleAutocompletePrediction {
  description: string;       
  place_id: string;         
  structured_formatting: {
    main_text: string;       
    secondary_text: string;  
  };
}

export interface GoogleAutocompleteResponse {
  predictions: GoogleAutocompletePrediction[];
  status: string;
}

export interface GooglePlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
  address_components: GoogleAddressComponent[];
}

export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface ParsedAddress {
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
}
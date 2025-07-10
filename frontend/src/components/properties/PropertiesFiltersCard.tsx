import React, { useEffect, useState, useMemo } from 'react';
import LayoutFiltersCard from '../common/FiltersCard';
import SearchableDropdown from '../common/SearchableDropdown';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useSearchService } from '../../services/search';
import { Agency } from '../../types/property';

export interface Option {
  value: string;
  label: string;
}

interface PropertiesFiltersCardProps {
  onAddressChange: (address: string | null) => void;
  onSuburbChange: (suburb: string | null) => void;
  onStateChange: (state: string | null) => void;
  onPostcodeChange: (postcode: string | null) => void;
  onOwnerTypeChange: (ownerType: string | null) => void; // Changed from separate isAgency/isPrivate
  onIsActiveChange: (isActive: boolean | null) => void;
  onAgencyChange: (agencyId: string | null) => void;
  currentAddress: string | null;
  currentSuburb: string | null;
  currentState: string | null;
  currentPostcode: string | null;
  currentOwnerType: string | null; // Changed from separate currentIsAgency/currentIsPrivate
  currentIsActive: boolean | null;
  currentAgency: string | null;
}

const PropertiesFiltersCard: React.FC<PropertiesFiltersCardProps> = ({
  onAddressChange,
  onSuburbChange,
  onStateChange,
  onPostcodeChange,
  onOwnerTypeChange,
  onIsActiveChange,
  onAgencyChange,
  currentAddress,
  currentSuburb,
  currentState,
  currentPostcode,
  currentOwnerType,
  currentIsActive,
  currentAgency
}) => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [suburbs, setSuburbs] = useState<Option[]>([]);
  const [postcodes, setPostcodes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedGet } = useAuthenticatedApi();
  const searchService = useSearchService();

  const stateOptions = [
    { value: 'NSW', label: 'New South Wales' },
    { value: 'VIC', label: 'Victoria' },
    { value: 'QLD', label: 'Queensland' },
    { value: 'WA', label: 'Western Australia' },
    { value: 'SA', label: 'South Australia' },
    { value: 'TAS', label: 'Tasmania' },
    { value: 'NT', label: 'Northern Territory' },
    { value: 'ACT', label: 'Australian Capital Territory' }
  ];

  const booleanOptions = [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' }
  ];

  // Owner type options
  const ownerTypeOptions = [
    { value: 'agency', label: 'Agency Managed' },
    { value: 'private', label: 'Privately Owned' }
  ];

  const agencyOptions = useMemo(() => 
    agencies.map(agency => ({
      value: agency.id.toString(),
      label: agency.name
    }))
  , [agencies]);

  // Local filter values state
  const [localValues, setLocalValues] = useState({
    address: null as Option | null,
    suburb: null as Option | null,
    state: null as Option | null,
    postcode: null as Option | null,
    ownerType: null as Option | null, // Changed from separate isAgency/isPrivate
    isActive: null as Option | null,
    agency: null as Option | null
  });

  // Applied filter values state
  const [appliedValues, setAppliedValues] = useState({
    address: null as Option | null,
    suburb: null as Option | null,
    state: null as Option | null,
    postcode: null as Option | null,
    ownerType: null as Option | null, // Changed from separate isAgency/isPrivate
    isActive: null as Option | null,
    agency: null as Option | null
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [agenciesResponse, suburbsResponse, postcodesResponse] = await Promise.all([
          authenticatedGet('/properties/agencies/'),
          authenticatedGet('/properties/suburbs/'),
          authenticatedGet('/properties/postcodes/')
        ]);
        
        if (mounted) {
          setAgencies(agenciesResponse);
          setSuburbs(suburbsResponse);
          setPostcodes(postcodesResponse);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching data:', error);
          setError('Failed to load filter data. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize filter values when data is loaded
  useEffect(() => {
    const initializeValues = async () => {
      let addressOption = null;
      
      // If there's a currentAddress (property ID), fetch the corresponding address label
      if (currentAddress) {
        try {
          // Use authenticatedGet directly to avoid the searchService dependency issue
          const addressOptions = await authenticatedGet('/properties/addresses/');
          addressOption = addressOptions.find((option: Option) => option.value === currentAddress) || null;
          
          // If not found in search, create a fallback option (shouldn't happen with proper data)
          if (!addressOption) {
            addressOption = { value: currentAddress, label: currentAddress };
          }
        } catch (error) {
          console.error('Error fetching address for current value:', error);
          addressOption = { value: currentAddress, label: currentAddress };
        }
      }

      const initialValues = {
        address: addressOption,
        suburb: currentSuburb ? suburbs.find(opt => opt.value === currentSuburb) || { value: currentSuburb, label: currentSuburb } : null,
        state: currentState ? stateOptions.find(opt => opt.value === currentState) || null : null,
        postcode: currentPostcode ? postcodes.find(opt => opt.value === currentPostcode) || { value: currentPostcode, label: currentPostcode } : null,
        ownerType: currentOwnerType ? ownerTypeOptions.find(opt => opt.value === currentOwnerType) || null : null, // Changed
        isActive: currentIsActive !== null ? booleanOptions.find(opt => opt.value === currentIsActive.toString()) || null : null,
        agency: currentAgency ? agencyOptions.find(opt => opt.value === currentAgency) || null : null
      };

      setLocalValues(initialValues);
      setAppliedValues(initialValues);
    };

    initializeValues();
  }, [currentAddress, currentSuburb, currentState, currentPostcode, currentOwnerType, currentIsActive, currentAgency, suburbs, postcodes, agencyOptions, authenticatedGet]);

  const handleFilterChange = (filterId: string, value: Option | null) => {
    setLocalValues(prev => ({ ...prev, [filterId]: value }));
  };

  const handleApply = () => {
    const isOption = (value: any): value is Option => {
      return value && typeof value === 'object' && 'value' in value && 'label' in value;
    };

    onAddressChange(isOption(localValues.address) ? localValues.address.value : null);
    onSuburbChange(isOption(localValues.suburb) ? localValues.suburb.value : null);
    onPostcodeChange(isOption(localValues.postcode) ? localValues.postcode.value : null);
    onStateChange(isOption(localValues.state) ? localValues.state.value : null);
    onOwnerTypeChange(isOption(localValues.ownerType) ? localValues.ownerType.value : null); // Changed
    onIsActiveChange(isOption(localValues.isActive) ? localValues.isActive.value === 'true' : null);
    onAgencyChange(isOption(localValues.agency) ? localValues.agency.value : null);

    setAppliedValues(localValues);
  };

  const handleClear = () => {
    const clearedValues = {
      address: null,
      suburb: null,
      state: null,
      postcode: null,
      ownerType: null, // Changed
      isActive: null,
      agency: null
    };

    setLocalValues(clearedValues);
    setAppliedValues(clearedValues);

    onAddressChange(null);
    onSuburbChange(null);
    onPostcodeChange(null);
    onStateChange(null);
    onOwnerTypeChange(null); // Changed
    onIsActiveChange(null);
    onAgencyChange(null);
  };

  const handleIndividualFilterClear = (filterId: string) => {
    const clearedValues = { ...localValues, [filterId]: null };
    setLocalValues(clearedValues);
    setAppliedValues(clearedValues);

    switch (filterId) {
      case 'address':
        onAddressChange(null);
        break;
      case 'suburb':
        onSuburbChange(null);
        break;
      case 'state':
        onStateChange(null);
        break;
      case 'postcode':
        onPostcodeChange(null);
        break;
      case 'ownerType': // Changed
        onOwnerTypeChange(null);
        break;
      case 'isActive':
        onIsActiveChange(null);
        break;
      case 'agency':
        onAgencyChange(null);
        break;
    }
  };

  const hasPendingChanges = JSON.stringify(localValues) !== JSON.stringify(appliedValues);

  const filterLabels = {
    address: 'Address',
    suburb: 'Suburb',
    state: 'State',
    postcode: 'Postcode',
    ownerType: 'Owner Type', // Changed
    isActive: 'Active',
    agency: 'Agency'
  };

  const activeFilters = Object.entries(appliedValues)
    .filter(([, value]) => value !== null)
    .map(([filterId, value]) => ({
      id: filterId,
      label: filterLabels[filterId as keyof typeof filterLabels],
      value: value!.label,
      onClear: () => handleIndividualFilterClear(filterId)
    }));

  return (
    <LayoutFiltersCard
      title="Property Filters"
      description="Filter properties by various criteria"
      activeFilters={activeFilters}
      onApply={handleApply}
      onClearAll={handleClear}
      hasPendingChanges={hasPendingChanges}
    >
      <SearchableDropdown
        label="Address"
        value={localValues.address}
        onChange={(option) => handleFilterChange('address', option)}
        onSearch={searchService.searchAddresses}
        placeholder="Search by address..."
        allOptionLabel="All Addresses"
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Suburb"
        value={localValues.suburb}
        onChange={(option) => handleFilterChange('suburb', option)}
        options={suburbs}
        placeholder="Select suburb..."
        allOptionLabel="All Suburbs"
        loading={loading}
        error={error}
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="State"
        value={localValues.state}
        onChange={(option) => handleFilterChange('state', option)}
        options={stateOptions}
        placeholder="Select state..."
        allOptionLabel="All States"
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Postcode"
        value={localValues.postcode}
        onChange={(option) => handleFilterChange('postcode', option)}
        options={postcodes}
        placeholder="Select postcode..."
        allOptionLabel="All Postcodes"
        loading={loading}
        error={error}
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Owner Type"
        value={localValues.ownerType}
        onChange={(option) => handleFilterChange('ownerType', option)}
        options={ownerTypeOptions}
        placeholder="Select owner type..."
        allOptionLabel="All Properties"
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Active"
        value={localValues.isActive}
        onChange={(option) => handleFilterChange('isActive', option)}
        options={booleanOptions}
        placeholder="Select option..."
        allOptionLabel="All Properties"
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Agency"
        value={localValues.agency}
        onChange={(option) => handleFilterChange('agency', option)}
        options={agencyOptions}
        placeholder="Select agency..."
        allOptionLabel="All Agencies"
        loading={loading}
        error={error}
        showApplyButton={false}
        showClearButton={true}
      />
    </LayoutFiltersCard>
  );
};

export default PropertiesFiltersCard; 
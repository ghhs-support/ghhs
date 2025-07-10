import React, { useEffect, useState, useMemo } from 'react';
import ComponentCard from '../common/ComponentCard';
import SearchableDropdown from '../common/SearchableDropdown';
import Button from '../ui/button/Button';
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
  onIsAgencyChange: (isAgency: boolean | null) => void;
  onIsPrivateChange: (isPrivate: boolean | null) => void;
  onIsActiveChange: (isActive: boolean | null) => void;
  onAgencyChange: (agencyId: string | null) => void;
  currentAddress: string | null;
  currentSuburb: string | null;
  currentState: string | null;
  currentPostcode: string | null;
  currentIsAgency: boolean | null;
  currentIsPrivate: boolean | null;
  currentIsActive: boolean | null;
  currentAgency: string | null;
}

const PropertiesFiltersCard: React.FC<PropertiesFiltersCardProps> = ({
  onAddressChange,
  onSuburbChange,
  onStateChange,
  onPostcodeChange,
  onIsAgencyChange,
  onIsPrivateChange,
  onIsActiveChange,
  onAgencyChange,
  currentAddress,
  currentSuburb,
  currentState,
  currentPostcode,
  currentIsAgency,
  currentIsPrivate,
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
    isAgency: null as Option | null,
    isPrivate: null as Option | null,
    isActive: null as Option | null,
    agency: null as Option | null
  });

  // Applied filter values state
  const [appliedValues, setAppliedValues] = useState({
    address: null as Option | null,
    suburb: null as Option | null,
    state: null as Option | null,
    postcode: null as Option | null,
    isAgency: null as Option | null,
    isPrivate: null as Option | null,
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
    const initialValues = {
      address: currentAddress ? { value: currentAddress, label: currentAddress } : null,
      suburb: currentSuburb ? suburbs.find(opt => opt.value === currentSuburb) || { value: currentSuburb, label: currentSuburb } : null,
      state: currentState ? stateOptions.find(opt => opt.value === currentState) || null : null,
      postcode: currentPostcode ? postcodes.find(opt => opt.value === currentPostcode) || { value: currentPostcode, label: currentPostcode } : null,
      isAgency: currentIsAgency !== null ? booleanOptions.find(opt => opt.value === currentIsAgency.toString()) || null : null,
      isPrivate: currentIsPrivate !== null ? booleanOptions.find(opt => opt.value === currentIsPrivate.toString()) || null : null,
      isActive: currentIsActive !== null ? booleanOptions.find(opt => opt.value === currentIsActive.toString()) || null : null,
      agency: currentAgency ? agencyOptions.find(opt => opt.value === currentAgency) || null : null
    };

    setLocalValues(initialValues);
    setAppliedValues(initialValues);
  }, [currentAddress, currentSuburb, currentState, currentPostcode, currentIsAgency, currentIsPrivate, currentIsActive, currentAgency, suburbs, postcodes, agencyOptions]);

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
    onIsAgencyChange(isOption(localValues.isAgency) ? localValues.isAgency.value === 'true' : null);
    onIsPrivateChange(isOption(localValues.isPrivate) ? localValues.isPrivate.value === 'true' : null);
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
      isAgency: null,
      isPrivate: null,
      isActive: null,
      agency: null
    };

    setLocalValues(clearedValues);
    setAppliedValues(clearedValues);

    onAddressChange(null);
    onSuburbChange(null);
    onPostcodeChange(null);
    onStateChange(null);
    onIsAgencyChange(null);
    onIsPrivateChange(null);
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
      case 'isAgency':
        onIsAgencyChange(null);
        break;
      case 'isPrivate':
        onIsPrivateChange(null);
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
  const hasActiveFilters = Object.values(appliedValues).some(value => value !== null);

  return (
    <ComponentCard
      title="Property Filters"
      desc="Filter properties by various criteria"
    >
      <div className="space-y-4">
        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(appliedValues).map(([filterId, value]) => {
              if (value === null) return null;

              const filterLabels = {
                address: 'Address',
                suburb: 'Suburb',
                state: 'State',
                postcode: 'Postcode',
                isAgency: 'Agency Managed',
                isPrivate: 'Privately Owned',
                isActive: 'Active',
                agency: 'Agency'
              };

              return (
                <span
                  key={filterId}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full dark:bg-blue-900/20 dark:text-blue-300"
                >
                  <span className="font-medium">{filterLabels[filterId as keyof typeof filterLabels]}:</span>
                  <span>{value.label}</span>
                  <button
                    onClick={() => handleIndividualFilterClear(filterId)}
                    className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    title="Clear filter"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Filter inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            label="Agency Managed"
            value={localValues.isAgency}
            onChange={(option) => handleFilterChange('isAgency', option)}
            options={booleanOptions}
            placeholder="Select option..."
            allOptionLabel="All Properties"
            showApplyButton={false}
            showClearButton={true}
          />

          <SearchableDropdown
            label="Privately Owned"
            value={localValues.isPrivate}
            onChange={(option) => handleFilterChange('isPrivate', option)}
            options={booleanOptions}
            placeholder="Select option..."
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
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!hasActiveFilters}
          >
            Clear All
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={!hasPendingChanges}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
};

export default PropertiesFiltersCard; 
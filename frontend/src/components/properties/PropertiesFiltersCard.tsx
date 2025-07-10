import React, { useEffect, useState, useMemo } from 'react';
import LayoutFiltersCard from '../common/FiltersCard';
import SearchableDropdown from '../common/SearchableDropdown';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import { useSearchService } from '../../services/search';
import { Agency, PrivateOwner } from '../../types/property';

export interface Option {
  value: string;
  label: string;
}

interface PropertiesFiltersCardProps {
  onAddressChange: (address: string | null) => void;
  onSuburbChange: (suburb: string | null) => void;
  onStateChange: (state: string | null) => void;
  onPostcodeChange: (postcode: string | null) => void;
  onOwnerTypeChange: (ownerType: string | null) => void;
  onIsActiveChange: (isActive: boolean | null) => void;
  onAgencyChange: (agencyId: string | null) => void;
  onPrivateOwnerChange: (privateOwnerId: string | null) => void;
  onTenantChange: (tenantId: string | null) => void; // New prop
  currentAddress: string | null;
  currentSuburb: string | null;
  currentState: string | null;
  currentPostcode: string | null;
  currentOwnerType: string | null;
  currentIsActive: boolean | null;
  currentAgency: string | null;
  currentPrivateOwner: string | null;
  currentTenant: string | null; // New prop
}

const PropertiesFiltersCard: React.FC<PropertiesFiltersCardProps> = ({
  onAddressChange,
  onSuburbChange,
  onStateChange,
  onPostcodeChange,
  onOwnerTypeChange,
  onIsActiveChange,
  onAgencyChange,
  onPrivateOwnerChange,
  onTenantChange,
  currentAddress,
  currentSuburb,
  currentState,
  currentPostcode,
  currentOwnerType,
  currentIsActive,
  currentAgency,
  currentPrivateOwner,
  currentTenant
}) => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [privateOwners, setPrivateOwners] = useState<PrivateOwner[]>([]);
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

  // Private owner options
  const privateOwnerOptions = useMemo(() => 
    privateOwners.map(owner => ({
      value: owner.id.toString(),
      label: `${owner.first_name} ${owner.last_name}${owner.email ? ` (${owner.email})` : ''}`
    }))
  , [privateOwners]);

  // Local filter values state
  const [localValues, setLocalValues] = useState({
    address: null as Option | null,
    suburb: null as Option | null,
    state: null as Option | null,
    postcode: null as Option | null,
    ownerType: null as Option | null,
    isActive: null as Option | null,
    agency: null as Option | null,
    privateOwner: null as Option | null,
    tenant: null as Option | null // New field
  });

  // Applied filter values state
  const [appliedValues, setAppliedValues] = useState({
    address: null as Option | null,
    suburb: null as Option | null,
    state: null as Option | null,
    postcode: null as Option | null,
    ownerType: null as Option | null,
    isActive: null as Option | null,
    agency: null as Option | null,
    privateOwner: null as Option | null,
    tenant: null as Option | null // New field
  });

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [agenciesResponse, privateOwnersResponse, suburbsResponse, postcodesResponse] = await Promise.all([
          authenticatedGet('/properties/agencies/'),
          authenticatedGet('/properties/private-owners/'),
          authenticatedGet('/properties/suburbs/'),
          authenticatedGet('/properties/postcodes/')
        ]);
        
        if (mounted) {
          setAgencies(agenciesResponse);
          setPrivateOwners(privateOwnersResponse);
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
      let tenantOption = null;
      
      // If there's a currentAddress (property ID), fetch the corresponding address label
      if (currentAddress) {
        try {
          const addressOptions = await authenticatedGet('/properties/addresses/');
          addressOption = addressOptions.find((option: Option) => option.value === currentAddress) || null;
          
          if (!addressOption) {
            addressOption = { value: currentAddress, label: `Property ID: ${currentAddress}` };
          }
        } catch (error) {
          console.error('Error fetching address for current value:', error);
          addressOption = { value: currentAddress, label: `Property ID: ${currentAddress}` };
        }
      }

      // If there's a currentTenant (tenant ID), fetch the corresponding tenant label
      if (currentTenant) {
        try {
          const tenant = await authenticatedGet(`/properties/tenants/${currentTenant}/`);
          tenantOption = {
            value: currentTenant,
            label: `${tenant.first_name} ${tenant.last_name} - ${tenant.phone}`
          };
        } catch (error) {
          console.error('Error fetching tenant for current value:', error);
          tenantOption = { value: currentTenant, label: `Tenant ID: ${currentTenant}` };
        }
      }

      const initialValues = {
        address: addressOption,
        suburb: currentSuburb ? suburbs.find(opt => opt.value === currentSuburb) || { value: currentSuburb, label: currentSuburb } : null,
        state: currentState ? stateOptions.find(opt => opt.value === currentState) || null : null,
        postcode: currentPostcode ? postcodes.find(opt => opt.value === currentPostcode) || { value: currentPostcode, label: currentPostcode } : null,
        ownerType: currentOwnerType ? ownerTypeOptions.find(opt => opt.value === currentOwnerType) || null : null,
        isActive: currentIsActive !== null ? booleanOptions.find(opt => opt.value === currentIsActive.toString()) || null : null,
        agency: currentAgency ? agencyOptions.find(opt => opt.value === currentAgency) || { value: currentAgency, label: `Agency ID: ${currentAgency}` } : null,
        privateOwner: currentPrivateOwner ? privateOwnerOptions.find(opt => opt.value === currentPrivateOwner) || { value: currentPrivateOwner, label: `Owner ID: ${currentPrivateOwner}` } : null,
        tenant: tenantOption
      };

      setLocalValues(initialValues);
      setAppliedValues(initialValues);
    };

    initializeValues();
  }, [currentAddress, currentSuburb, currentState, currentPostcode, currentOwnerType, currentIsActive, currentAgency, currentPrivateOwner, currentTenant, suburbs, postcodes, agencyOptions, privateOwnerOptions, authenticatedGet]);

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
    onOwnerTypeChange(isOption(localValues.ownerType) ? localValues.ownerType.value : null);
    onIsActiveChange(isOption(localValues.isActive) ? localValues.isActive.value === 'true' : null);
    onAgencyChange(isOption(localValues.agency) ? localValues.agency.value : null);
    onPrivateOwnerChange(isOption(localValues.privateOwner) ? localValues.privateOwner.value : null);
    onTenantChange(isOption(localValues.tenant) ? localValues.tenant.value : null); // New field

    setAppliedValues(localValues);
  };

  const handleClear = () => {
    const clearedValues = {
      address: null,
      suburb: null,
      state: null,
      postcode: null,
      ownerType: null,
      isActive: null,
      agency: null,
      privateOwner: null,
      tenant: null // New field
    };

    setLocalValues(clearedValues);
    setAppliedValues(clearedValues);

    onAddressChange(null);
    onSuburbChange(null);
    onPostcodeChange(null);
    onStateChange(null);
    onOwnerTypeChange(null);
    onIsActiveChange(null);
    onAgencyChange(null);
    onPrivateOwnerChange(null);
    onTenantChange(null); // New field
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
      case 'ownerType':
        onOwnerTypeChange(null);
        break;
      case 'isActive':
        onIsActiveChange(null);
        break;
      case 'agency':
        onAgencyChange(null);
        break;
      case 'privateOwner':
        onPrivateOwnerChange(null);
        break;
      case 'tenant': // New case
        onTenantChange(null);
        break;
    }
  };

  const hasPendingChanges = JSON.stringify(localValues) !== JSON.stringify(appliedValues);

  const filterLabels = {
    address: 'Address',
    suburb: 'Suburb',
    state: 'State',
    postcode: 'Postcode',
    ownerType: 'Owner Type',
    isActive: 'Active',
    agency: 'Agency',
    privateOwner: 'Private Owner',
    tenant: 'Tenant' // New label
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

      <SearchableDropdown
        label="Private Owner"
        value={localValues.privateOwner}
        onChange={(option) => handleFilterChange('privateOwner', option)}
        options={privateOwnerOptions}
        placeholder="Select private owner..."
        allOptionLabel="All Private Owners"
        loading={loading}
        error={error}
        showApplyButton={false}
        showClearButton={true}
      />

      <SearchableDropdown
        label="Tenant"
        value={localValues.tenant}
        onChange={(option) => handleFilterChange('tenant', option)}
        onSearch={searchService.searchTenants}
        placeholder="Search by tenant name or mobile..."
        allOptionLabel="All Tenants"
        showApplyButton={false}
        showClearButton={true}
      />
    </LayoutFiltersCard>
  );
};

export default PropertiesFiltersCard; 
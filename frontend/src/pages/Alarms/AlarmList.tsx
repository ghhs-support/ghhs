import { useEffect, useState, useCallback, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import AlarmBasicTable from "../../components/alarms/AlarmBasictable";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import AlarmForm from "../../components/alarms/AlarmForm";
import SearchableDropdown from "../../components/alarms/SearchableDropdown";
import DatePicker from "../../components/alarms/date-picker/DatePicker";

import api from "../../services/api";

interface Tenant {
  id: number;
  name: string;
  phone: string;
}

interface Alarm {
  id: number;
  date: string;
  is_rental: boolean;
  is_private: boolean;
  realestate_name: string | null;
  street_number: string | null;
  street_name: string | null;
  suburb: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  who_contacted: string;
  contact_method: 'email' | 'phone' | 'work_order';
  work_order_number: string;
  sound_type: 'full_alarm' | 'chirping_alarm';
  install_date: string | null;
  brand: 'red' | 'firepro' | 'emerald' | 'cavius' | 'other';
  hardwire_alarm: number | null;
  wireless_alarm: number | null;
  is_wall_control: boolean;
  completed: boolean;
  stage: 'to_be_booked' | 'quote_sent' | 'completed' | 'to_be_called';
  tenants: Tenant[];
  created_at: string;
  updated_at: string;
  notes: string | null;
}

interface AddressOption {
  value: string;
  label: string;
}

export default function AlarmListPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [currentSearch, setCurrentSearch] = useState("");
  const [currentStageFilter, setCurrentStageFilter] = useState("");
  const [currentBrandFilter, setCurrentBrandFilter] = useState("");
  const [currentAddressFilter, setCurrentAddressFilter] = useState("");
  const [currentDateFrom, setCurrentDateFrom] = useState("");
  const [currentDateTo, setCurrentDateTo] = useState("");
  const [currentExactDate, setCurrentExactDate] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [currentTenantFilter, setCurrentTenantFilter] = useState("");
  const [selectedDateFrom, setSelectedDateFrom] = useState("");
  const [selectedDateTo, setSelectedDateTo] = useState("");
  const [selectedExactDate, setSelectedExactDate] = useState("");
  const [isDateRangeMode, setIsDateRangeMode] = useState(true);
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [tenantOptions, setTenantOptions] = useState<AddressOption[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addressSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tenantSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stageOptions = [
    { value: '', label: 'All Stages' },
    { value: 'to_be_booked', label: 'To Be Booked' },
    { value: 'quote_sent', label: 'Quote Sent' },
    { value: 'completed', label: 'Completed' },
    { value: 'to_be_called', label: 'To Be Called' },
  ];

  const brandOptions = [
    { value: '', label: 'All Brands' },
    { value: 'red', label: 'Red' },
    { value: 'firepro', label: 'FirePro' },
    { value: 'emerald', label: 'Emerald' },
    { value: 'cavius', label: 'Cavius' },
    { value: 'other', label: 'Other' },
  ];

  const fetchAlarms = useCallback(async (page: number, pageSize: number, search?: string, stage?: string, address?: string, dateFrom?: string, dateTo?: string, dateExact?: string, tenant?: string, brand?: string) => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      
      if (search?.trim()) {
        params.append('search', search.trim());
      }

      if (stage?.trim()) {
        params.append('stage', stage.trim());
      }

      if (address?.trim()) {
        params.append('address', address.trim());
      }

      if (dateFrom?.trim()) {
        params.append('date_from', dateFrom.trim());
      }

      if (dateTo?.trim()) {
        params.append('date_to', dateTo.trim());
      }

      if (dateExact?.trim()) {
        params.append('date_exact', dateExact.trim());
      }

      if (tenant?.trim()) {
        params.append('tenant', tenant.trim());
      }

      if (brand?.trim()) {
        params.append('brand', brand.trim());
      }

      const response = await api.get(`/api/alarms/?${params.toString()}`);
      
      setAlarms(response.data.results);
      setTotalCount(response.data.count);
      setCurrentPage(page);
      setCurrentPageSize(pageSize);
      setCurrentSearch(search || "");
      setCurrentStageFilter(stage || "");
      setCurrentAddressFilter(address || "");
      setCurrentDateFrom(dateFrom || "");
      setCurrentDateTo(dateTo || "");
      setCurrentExactDate(dateExact || "");
      setCurrentTenantFilter(tenant || "");
      setCurrentBrandFilter(brand || "");
    } catch (error) {
      console.error('Error fetching alarms:', error);
      setError('Failed to fetch alarms. Please try again.');
      // Keep the previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAddressSuggestions = useCallback(async (query: string) => {
    try {
      setAddressLoading(true);
      const response = await api.get(`/api/address-suggestions/?q=${encodeURIComponent(query)}`);
      setAddressOptions(response.data);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setAddressOptions([]);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const fetchTenantSuggestions = useCallback(async (query: string) => {
    try {
      setTenantLoading(true);
      const response = await api.get(`/api/tenant-suggestions/?q=${encodeURIComponent(query)}`);
      setTenantOptions(response.data);
    } catch (error) {
      console.error('Error fetching tenant suggestions:', error);
      setTenantOptions([]);
    } finally {
      setTenantLoading(false);
    }
  }, []);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAlarmCreated = () => {
    fetchAlarms(currentPage, currentPageSize, currentSearch, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter);
  };

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    fetchAlarms(page, pageSize, currentSearch, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter);
  }, [fetchAlarms, currentSearch, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter]);

  const handleSearchChange = useCallback((search: string) => {
    fetchAlarms(1, currentPageSize, search, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter);
  }, [fetchAlarms, currentPageSize, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter]);

  const handleStageFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStage(e.target.value);
  };

  const handleBrandFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBrand(e.target.value);
  };

  const handleAddressSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (addressSearchTimeoutRef.current) {
      clearTimeout(addressSearchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    addressSearchTimeoutRef.current = setTimeout(() => {
      fetchAddressSuggestions(query);
    }, 300); // 300ms delay
  }, [fetchAddressSuggestions]);

  const handleAddressSelect = useCallback((option: AddressOption | null) => {
    setSelectedAddress(option?.value || "");
  }, []);

  const handleTenantSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (tenantSearchTimeoutRef.current) {
      clearTimeout(tenantSearchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    tenantSearchTimeoutRef.current = setTimeout(() => {
      fetchTenantSuggestions(query);
    }, 300); // 300ms delay
  }, [fetchTenantSuggestions]);

  const handleTenantSelect = useCallback((option: AddressOption | null) => {
    setSelectedTenant(option?.value || "");
  }, []);

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateToBackend = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateFromChange = (selectedDates: Date[]) => {
    if (selectedDates.length > 0) {
      const date = selectedDates[0];
      const backendDateStr = formatDateToBackend(date);
      setSelectedDateFrom(backendDateStr);
    } else {
      setSelectedDateFrom('');
    }
  };

  const handleDateToChange = (selectedDates: Date[]) => {
    if (selectedDates.length > 0) {
      const date = selectedDates[0];
      const backendDateStr = formatDateToBackend(date);
      setSelectedDateTo(backendDateStr);
    } else {
      setSelectedDateTo('');
    }
  };

  const handleExactDateChange = (selectedDates: Date[]) => {
    if (selectedDates.length > 0) {
      const date = selectedDates[0];
      const backendDateStr = formatDateToBackend(date);
      setSelectedExactDate(backendDateStr);
    } else {
      setSelectedExactDate('');
    }
  };

  const handleDateModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const isRange = e.target.value === 'range';
    setIsDateRangeMode(isRange);
    // Clear all date filters when switching modes
    setSelectedDateFrom('');
    setSelectedDateTo('');
    setSelectedExactDate('');
    setCurrentDateFrom('');
    setCurrentDateTo('');
    setCurrentExactDate('');
  };

  const handleApplyFilters = useCallback(() => {
    let dateFrom = '';
    let dateTo = '';
    let dateExact = '';
    
    if (isDateRangeMode) {
      dateFrom = (selectedDateFrom && selectedDateTo) ? selectedDateFrom : '';
      dateTo = (selectedDateFrom && selectedDateTo) ? selectedDateTo : '';
      
      if ((selectedDateFrom && !selectedDateTo) || (!selectedDateFrom && selectedDateTo)) {
        setError("Please select both From and To dates for date range filtering");
        return;
      }
    } else {
      dateExact = selectedExactDate;
    }
    
    setError("");
    setCurrentDateFrom(dateFrom);
    setCurrentDateTo(dateTo);
    setCurrentExactDate(dateExact);
    setCurrentTenantFilter(selectedTenant);
    setCurrentBrandFilter(selectedBrand);
    
    fetchAlarms(1, currentPageSize, currentSearch, selectedStage, selectedAddress, dateFrom, dateTo, dateExact, selectedTenant, selectedBrand);
  }, [fetchAlarms, currentPageSize, currentSearch, selectedStage, selectedAddress, selectedDateFrom, selectedDateTo, selectedExactDate, isDateRangeMode, selectedTenant, selectedBrand]);

  const handleClearAllFilters = useCallback(() => {
    setSelectedStage("");
    setSelectedBrand("");
    setSelectedAddress("");
    setSelectedDateFrom("");
    setSelectedDateTo("");
    setSelectedExactDate("");
    setSelectedTenant("");
    setCurrentStageFilter("");
    setCurrentBrandFilter("");
    setCurrentAddressFilter("");
    setCurrentDateFrom("");
    setCurrentDateTo("");
    setCurrentExactDate("");
    setCurrentTenantFilter("");
    fetchAlarms(1, currentPageSize, currentSearch, "", "", "", "", "", "", "");
  }, [fetchAlarms, currentPageSize, currentSearch]);

  const handleClearStageFilter = useCallback(() => {
    setSelectedStage("");
    fetchAlarms(1, currentPageSize, currentSearch, "", currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter);
  }, [fetchAlarms, currentPageSize, currentSearch, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter]);

  const handleClearBrandFilter = useCallback(() => {
    setSelectedBrand("");
    setCurrentBrandFilter("");
    fetchAlarms(1, currentPageSize, currentSearch, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, "");
  }, [fetchAlarms, currentPageSize, currentSearch, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter]);

  const handleClearAddressFilter = useCallback(() => {
    setSelectedAddress("");
    fetchAlarms(1, currentPageSize, currentSearch, currentStageFilter, "", currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter);
  }, [fetchAlarms, currentPageSize, currentSearch, currentStageFilter, currentDateFrom, currentDateTo, currentExactDate, currentTenantFilter, currentBrandFilter]);

  const handleClearDateFilter = useCallback(() => {
    setSelectedDateFrom("");
    setSelectedDateTo("");
    setSelectedExactDate("");
    setCurrentDateFrom("");
    setCurrentDateTo("");
    setCurrentExactDate("");
    fetchAlarms(1, currentPageSize, currentSearch, currentStageFilter, currentAddressFilter, "", "", "", currentTenantFilter, currentBrandFilter);
  }, [fetchAlarms, currentPageSize, currentSearch, currentStageFilter, currentAddressFilter, currentTenantFilter, currentBrandFilter]);

  const handleClearTenantFilter = useCallback(() => {
    setSelectedTenant("");
    setCurrentTenantFilter("");
    fetchAlarms(1, currentPageSize, currentSearch, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, "", currentBrandFilter);
  }, [fetchAlarms, currentPageSize, currentSearch, currentStageFilter, currentAddressFilter, currentDateFrom, currentDateTo, currentExactDate, currentBrandFilter]);

  // Initial load
  useEffect(() => {
    fetchAlarms(1, 10, "", "", "", "", "", "", "", "");
  }, [fetchAlarms]);

  // Reset when component unmounts
  useEffect(() => {
    return () => {
      setAlarms([]);
      setLoading(true);
      setTotalCount(0);
      setCurrentPage(1);
      setCurrentPageSize(10);
      setCurrentSearch("");
      setCurrentStageFilter("");
      setCurrentAddressFilter("");
      setCurrentDateFrom("");
      setCurrentDateTo("");
      setSelectedStage("");
      setSelectedBrand("");
      setSelectedAddress("");
      setSelectedDateFrom("");
      setSelectedDateTo("");
      setSelectedExactDate("");
      setCurrentExactDate("");
      setIsDateRangeMode(true);
      setAddressOptions([]);
      setTenantOptions([]);
      setError("");
      
      // Clear timeout
      if (addressSearchTimeoutRef.current) {
        clearTimeout(addressSearchTimeoutRef.current);
      }
      if (tenantSearchTimeoutRef.current) {
        clearTimeout(tenantSearchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <PageMeta
        title="Alarm Management Dashboard | GHHS - Alarm Management System"
        description="Manage and track alarm installations and service requests"
      />
      <PageBreadcrumb pageTitle="Alarm Management" />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button
            variant="primary"
            onClick={handleAddClick}
          >
            Add New Alarm
          </Button>
        </div>

        {/* Filter Section */}
        <ComponentCard title="Filters">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stage Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stage</label>
                <div className="relative">
                  <select
                    value={selectedStage}
                    onChange={handleStageFilterChange}
                    className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg appearance-none shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    {stageOptions.map(option => (
                      <option key={option.value} value={option.value} className="dark:bg-gray-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                    <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
                <div className="relative">
                  <select
                    value={selectedBrand}
                    onChange={handleBrandFilterChange}
                    className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg appearance-none shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    {brandOptions.map(option => (
                      <option key={option.value} value={option.value} className="dark:bg-gray-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                    <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Address Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <SearchableDropdown
                  placeholder="Type to search addresses..."
                  onSearch={handleAddressSearch}
                  onSelect={handleAddressSelect}
                  options={addressOptions}
                  loading={addressLoading}
                  selectedValue={selectedAddress}
                  emptyMessage="No addresses found"
                  minSearchLength={2}
                />
              </div>

              {/* Tenant Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tenant or Mobile</label>
                <SearchableDropdown
                  placeholder="Search by tenant name or mobile..."
                  onSearch={handleTenantSearch}
                  onSelect={handleTenantSelect}
                  options={tenantOptions}
                  loading={tenantLoading}
                  selectedValue={selectedTenant}
                  emptyMessage="No tenants found"
                  minSearchLength={2}
                />
              </div>

              {/* Date Filter Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Filter Type</label>
                <div className="relative">
                  <select
                    value={isDateRangeMode ? 'range' : 'exact'}
                    onChange={handleDateModeChange}
                    className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg appearance-none shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    <option value="range">Date Range</option>
                    <option value="exact">Exact Date</option>
                  </select>
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                    <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                </div>
              </div>

              {isDateRangeMode ? (
                <>
                  {/* Date From Filter */}
                  <div className="space-y-2">
                    <DatePicker
                      id="date-from-filter"
                      label="Date From"
                      placeholder="Select start date"
                      onChange={handleDateFromChange}
                      value={selectedDateFrom}
                    />
                  </div>

                  {/* Date To Filter */}
                  <div className="space-y-2">
                    <DatePicker
                      id="date-to-filter"
                      label="Date To"
                      placeholder="Select end date"
                      onChange={handleDateToChange}
                      value={selectedDateTo}
                    />
                  </div>
                </>
              ) : (
                /* Exact Date Filter */
                <div className="space-y-2">
                  <DatePicker
                    id="date-exact-filter"
                    label="Exact Date"
                    placeholder="Select date"
                    onChange={handleExactDateChange}
                    value={selectedExactDate}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons and Error Display */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={handleApplyFilters}
                  className="px-6 py-2"
                >
                  Apply Filters
                </Button>
                
                {(currentStageFilter || currentBrandFilter || currentAddressFilter || currentDateFrom || currentDateTo || currentExactDate || currentTenantFilter) && (
                  <Button
                    variant="outline"
                    onClick={handleClearAllFilters}
                    className="px-4 py-2"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
              
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>

            {/* Active Filters Display */}
            {(currentStageFilter || currentBrandFilter || currentAddressFilter || currentDateFrom || currentDateTo || currentExactDate || currentTenantFilter) && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {currentStageFilter && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm dark:bg-blue-900 dark:text-blue-200">
                      <span>Stage: {stageOptions.find(opt => opt.value === currentStageFilter)?.label}</span>
                      <button
                        onClick={handleClearStageFilter}
                        className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {currentBrandFilter && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm dark:bg-indigo-900 dark:text-indigo-200">
                      <span>Brand: {brandOptions.find(opt => opt.value === currentBrandFilter)?.label}</span>
                      <button
                        onClick={handleClearBrandFilter}
                        className="ml-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {currentAddressFilter && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm dark:bg-green-900 dark:text-green-200">
                      <span>Address: {currentAddressFilter.length > 30 ? `${currentAddressFilter.substring(0, 30)}...` : currentAddressFilter}</span>
                      <button
                        onClick={handleClearAddressFilter}
                        className="ml-1 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {(currentDateFrom || currentDateTo || currentExactDate) && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm dark:bg-purple-900 dark:text-purple-200">
                      <span>
                        {currentExactDate 
                          ? `Date: ${formatDateForDisplay(currentExactDate)}`
                          : 'Date Range'
                        }
                      </span>
                      <button
                        onClick={handleClearDateFilter}
                        className="ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {currentTenantFilter && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm dark:bg-yellow-900 dark:text-yellow-200">
                      <span>Tenant: {currentTenantFilter.length > 30 ? `${currentTenantFilter.substring(0, 30)}...` : currentTenantFilter}</span>
                      <button
                        onClick={handleClearTenantFilter}
                        className="ml-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-300 dark:hover:text-yellow-100"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Alarm Table */}
        <AlarmBasicTable
          alarms={alarms}
          loading={loading}
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Add/Edit Alarm Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        className="w-full mx-4"
      >
        <div className="flex flex-col">
          <div className="mb-6">
            <h5 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              Add New Alarm
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fill in the details to create a new alarm entry
            </p>
          </div>
          <AlarmForm
            onClose={handleModalClose}
            onSuccess={handleAlarmCreated}
          />
        </div>
      </Modal>
    </>
  );
}
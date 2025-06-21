import { useEffect, useState, useCallback, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import AlarmBasicTable from "../../components/alarms/AlarmBasictable";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import AlarmForm from "../../components/alarms/AlarmForm";
import SearchableDropdown from "../../components/alarms/SearchableDropdown";

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
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Alarm[];
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
  const [currentAddressFilter, setCurrentAddressFilter] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addressSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stageOptions = [
    { value: '', label: 'All Stages' },
    { value: 'to_be_booked', label: 'To Be Booked' },
    { value: 'quote_sent', label: 'Quote Sent' },
    { value: 'completed', label: 'Completed' },
    { value: 'to_be_called', label: 'To Be Called' },
  ];

  const fetchAlarms = useCallback(async (page: number, pageSize: number, search?: string, stage?: string, address?: string) => {
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

      const response = await api.get(`/api/alarms/?${params.toString()}`);
      
      setAlarms(response.data.results);
      setTotalCount(response.data.count);
      setCurrentPage(page);
      setCurrentPageSize(pageSize);
      setCurrentSearch(search || "");
      setCurrentStageFilter(stage || "");
      setCurrentAddressFilter(address || "");
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

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAlarmCreated = () => {
    fetchAlarms(currentPage, currentPageSize, currentSearch, currentStageFilter, currentAddressFilter);
  };

  const handlePageChange = useCallback((page: number, pageSize: number) => {
    fetchAlarms(page, pageSize, currentSearch, currentStageFilter, currentAddressFilter);
  }, [fetchAlarms, currentSearch, currentStageFilter, currentAddressFilter]);

  const handleSearchChange = useCallback((search: string) => {
    fetchAlarms(1, currentPageSize, search, currentStageFilter, currentAddressFilter);
  }, [fetchAlarms, currentPageSize, currentStageFilter, currentAddressFilter]);

  const handleStageFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStage(e.target.value);
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

  const handleApplyFilters = useCallback(() => {
    fetchAlarms(1, currentPageSize, currentSearch, selectedStage, selectedAddress);
  }, [fetchAlarms, currentPageSize, currentSearch, selectedStage, selectedAddress]);

  const handleClearAllFilters = useCallback(() => {
    setSelectedStage("");
    setSelectedAddress("");
    setCurrentStageFilter("");
    setCurrentAddressFilter("");
    fetchAlarms(1, currentPageSize, currentSearch, "", "");
  }, [fetchAlarms, currentPageSize, currentSearch]);

  const handleClearStageFilter = useCallback(() => {
    setSelectedStage("");
    fetchAlarms(1, currentPageSize, currentSearch, "", currentAddressFilter);
  }, [fetchAlarms, currentPageSize, currentSearch, currentAddressFilter]);

  const handleClearAddressFilter = useCallback(() => {
    setSelectedAddress("");
    fetchAlarms(1, currentPageSize, currentSearch, currentStageFilter, "");
  }, [fetchAlarms, currentPageSize, currentSearch, currentStageFilter]);

  // Initial load
  useEffect(() => {
    fetchAlarms(1, 10, "", "", "");
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
      setSelectedStage("");
      setSelectedAddress("");
      setAddressOptions([]);
      setError("");
      
      // Clear timeout
      if (addressSearchTimeoutRef.current) {
        clearTimeout(addressSearchTimeoutRef.current);
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
          <h2 className="text-xl font-semibold">Alarm Management</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={handleApplyFilters}
                className="px-6 py-2"
              >
                Apply Filters
              </Button>
              
              {(currentStageFilter || currentAddressFilter) && (
                <Button
                  variant="outline"
                  onClick={handleClearAllFilters}
                  className="px-4 py-2"
                >
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {(currentStageFilter || currentAddressFilter) && (
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
                </div>
              </div>
            )}
          </div>
        </ComponentCard>

        <ComponentCard title="Alarm List">
          {error ? (
            <div className="flex justify-center items-center min-h-[400px] text-red-500">{error}</div>
          ) : (
            <AlarmBasicTable 
              alarms={alarms} 
              loading={loading}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              onSearchChange={handleSearchChange}
            />
          )}
        </ComponentCard>
      </div>

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

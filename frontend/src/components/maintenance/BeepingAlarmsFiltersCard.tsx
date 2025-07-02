import React, { useEffect, useState, useRef } from 'react';
import ComponentCard from '../common/ComponentCard';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import Button from '../ui/button/Button';
import Badge from "../ui/badge/Badge";

// Define a proper User type based on the backend serializer
interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Option {
  value: string;
  label: string;
}

interface BeepingAlarmsFiltersCardProps {
  onAllocationChange: (allocationId: string | null) => void;
  currentAllocation: string | null;
}

const BeepingAlarmsFiltersCard: React.FC<BeepingAlarmsFiltersCardProps> = ({ 
  onAllocationChange,
  currentAllocation 
}) => {
  const [allocations, setAllocations] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedGet } = useAuthenticatedApi();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tempSelection, setTempSelection] = useState<Option | null>(null);

  // Move getUserDisplayName before it's used
  const getUserDisplayName = (user: User): string => {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    return fullName || user.username;
  };

  // Move allocationOptions calculation inside a useMemo to optimize performance
  const allocationOptions = React.useMemo(() => 
    allocations.map(user => ({
      value: user.id.toString(),
      label: getUserDisplayName(user)
    }))
  , [allocations]);

  useEffect(() => {
    let mounted = true;

    const fetchAllocations = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await authenticatedGet('/common/users/');
        if (mounted) {
          setAllocations(response);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching users:', error);
          setError('Failed to load users. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAllocations();

    return () => {
      mounted = false;
    };
  }, []);

  // Update selected option when currentAllocation changes
  useEffect(() => {
    if (!isUserTyping && currentAllocation) {
      const option = allocationOptions.find(opt => opt.value === currentAllocation);
      if (option) {
        setSelectedOption(option);
        setTempSelection(option);
        setSearchQuery(option.label);
      }
    }
  }, [currentAllocation, allocationOptions, isUserTyping]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsUserTyping(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputClick = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsUserTyping(true);
    setIsOpen(true); // Always show dropdown when typing
    
    if (selectedOption && value !== selectedOption.label) {
      setSelectedOption(null);
    }
  };

  const handleOptionSelect = (option: Option) => {
    setTempSelection(option);
    setSearchQuery(option.label);
    setIsOpen(false);
    setIsUserTyping(false);
  };

  const handleClear = () => {
    setSelectedOption(null);
    setTempSelection(null);
    setSearchQuery("");
    setIsOpen(false);
    setIsUserTyping(false);
    onAllocationChange(null);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsUserTyping(true);
    if (searchQuery.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsUserTyping(false);
    }, 200);
  };

  const filteredOptions = searchQuery
    ? allocationOptions.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allocationOptions;

  const showResults = isOpen && searchQuery.length >= 2;
  const hasResults = filteredOptions.length > 0;

  const handleApplyFilters = () => {
    setSelectedOption(tempSelection);
    onAllocationChange(tempSelection?.value || null);
  };

  return (
    <ComponentCard 
      title="Filters"
      desc="Filter your beeping alarms"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="allocation" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Allocation
          </label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onClick={handleInputClick}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={selectedOption ? selectedOption.label : "Click to view all or type to search..."}
                className="w-full py-2 pl-3 pr-10 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 cursor-pointer"
              />
              
              {/* Dropdown arrow icon */}
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              >
                <svg 
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Clear button - show only when there's a selection or search query */}
              {(selectedOption || searchQuery) && (
                <button
                  onClick={handleClear}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Dropdown menu - show when isOpen is true (not just when searching) */}
            {isOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Loading...
                  </div>
                ) : filteredOptions.length > 0 ? (
                  <>
                    {/* "All Allocations" option */}
                    <button
                      onClick={() => {
                        handleOptionSelect({ value: '', label: 'All Allocations' });
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:hover:bg-gray-800 dark:focus:bg-gray-800 ${
                        !tempSelection ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-800 dark:text-white/90'
                      }`}
                    >
                      All Allocations
                    </button>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                    
                    {/* User options */}
                    {filteredOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleOptionSelect(option)}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:hover:bg-gray-800 dark:focus:bg-gray-800 ${
                          tempSelection?.value === option.value 
                            ? 'text-blue-600 dark:text-blue-400 font-medium' 
                            : 'text-gray-800 dark:text-white/90'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No allocations found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleApplyFilters}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            disabled={loading}
          >
            Apply Filters
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="w-full text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
            disabled={loading}
          >
            Clear Filters
          </Button>
        </div>

        {/* Active Filters Section */}
        <div className="pt-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Active Filters:</span>
            {!selectedOption ? (
              <span className="text-gray-500 dark:text-gray-400 italic">None</span>
            ) : (
              <div className="flex flex-wrap gap-2 ml-2">
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1">
                  <span className="text-xs text-gray-700 dark:text-gray-200">
                    Allocation: {selectedOption.label}
                  </span>
                  <button
                    onClick={handleClear}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    aria-label="Remove allocation filter"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ComponentCard>
  );
};

export default BeepingAlarmsFiltersCard;

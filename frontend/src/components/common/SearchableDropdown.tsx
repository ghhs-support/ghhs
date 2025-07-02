import React, { useEffect, useState, useRef } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options?: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  onApply?: (option: Option | null) => void;
  onSearch?: (query: string) => Promise<Option[] | undefined>;
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  label?: string;
  showApplyButton?: boolean;
  showClearButton?: boolean;
  className?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options = [],
  value,
  onChange,
  onApply,
  onSearch,
  loading = false,
  error = null,
  placeholder = "Click to view all or type to search...",
  label,
  showApplyButton = true,
  showClearButton = true,
  className = "",
  disabled = false,
  includeAllOption = true,
  allOptionLabel = "All Options"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [searchResults, setSearchResults] = useState<Option[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setSearchQuery(value.label);
    } else {
      setSearchQuery(""); // Clear the search query when value is null
    }
  }, [value]);

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

  // Load initial data when dropdown opens for the first time
  const loadInitialData = async () => {
    if (onSearch && !hasLoadedInitialData) {
      setIsSearching(true);
      try {
        console.log('Loading initial tenant data...');
        const results = await onSearch(''); // Empty string to get all tenants
        setSearchResults(results || []);
        setHasLoadedInitialData(true);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleInputClick = async () => {
    if (!disabled) {
      setIsOpen(true);
      await loadInitialData();
    }
  };

  const handleDropdownToggle = async () => {
    if (!disabled) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      if (newIsOpen) {
        await loadInitialData();
      }
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsUserTyping(true);
    setIsOpen(true);

    if (onSearch) {
      setIsSearching(true);
      try {
        console.log('Searching for:', value);
        const results = await onSearch(value);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Error searching:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleOptionSelect = (option: Option) => {
    onChange(option);
    setSearchQuery(option.label);
    setIsOpen(false);
    setIsUserTyping(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
    setIsOpen(false);
    setIsUserTyping(false);
    setSearchResults([]);
    setHasLoadedInitialData(false); // Reset so it loads data again next time
    inputRef.current?.focus();
  };

  const handleApply = () => {
    if (onApply) {
      onApply(value);
    }
  };

  // Use searchResults if onSearch is provided, otherwise use options
  const displayOptions = onSearch ? searchResults : options;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onFocus={() => setIsUserTyping(true)}
            onBlur={() => setTimeout(() => setIsUserTyping(false), 200)}
            placeholder={value ? value.label : placeholder}
            disabled={disabled}
            className="w-full py-2 pl-3 pr-10 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          
          {/* Dropdown arrow icon */}
          <button 
            onClick={handleDropdownToggle}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 disabled:opacity-50"
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

          {/* Clear button */}
          {showClearButton && (value || searchQuery) && (
            <button
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar dark:bg-gray-900 dark:border-gray-700">
            {loading || isSearching ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : error ? (
              <div className="px-3 py-2 text-sm text-red-500 dark:text-red-400">
                {error}
              </div>
            ) : displayOptions.length > 0 || includeAllOption ? (
              <>
                {includeAllOption && (
                  <>
                    <button
                      onClick={() => handleOptionSelect({ value: '', label: allOptionLabel })}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:hover:bg-gray-800 dark:focus:bg-gray-800 ${
                        !value ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-800 dark:text-white/90'
                      }`}
                    >
                      {allOptionLabel}
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>
                  </>
                )}
                
                {displayOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:hover:bg-gray-800 dark:focus:bg-gray-800 ${
                      value?.value === option.value 
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
                {searchQuery.length === 0 && !hasLoadedInitialData ? "Click to load tenants..." : 
                 searchQuery.length < 2 ? "Type at least 2 characters to search..." : 
                 "No options found"}
              </div>
            )}
          </div>
        )}
      </div>

      {showApplyButton && onApply && (
        <div className="flex space-x-2 pt-4">
          <button
            onClick={handleApply}
            disabled={disabled || loading}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Apply
          </button>
          <button
            onClick={handleClear}
            disabled={disabled || loading}
            className="w-full py-2 px-4 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown; 
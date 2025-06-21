import { useState, useEffect, useRef } from "react";

interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onSelect: (option: Option | null) => void;
  options: Option[];
  loading?: boolean;
  selectedValue?: string;
  emptyMessage?: string;
  minSearchLength?: number;
}

export default function SearchableDropdown({
  placeholder = "Type to search...",
  onSearch,
  onSelect,
  options,
  loading = false,
  selectedValue = "",
  emptyMessage = "No results found",
  minSearchLength = 2
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update selected option when selectedValue changes, but only if user is not actively typing
  useEffect(() => {
    if (!isUserTyping) {
      if (selectedValue) {
        const option = options.find(opt => opt.value === selectedValue);
        if (option) {
          setSelectedOption(option);
          setSearchQuery(option.label);
        }
      } else {
        // selectedValue is empty/cleared - reset everything
        setSelectedOption(null);
        setSearchQuery("");
        setIsOpen(false);
      }
    }
  }, [selectedValue, options, isUserTyping]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsUserTyping(true);
    
    // Clear selected option when user starts typing
    if (selectedOption && value !== selectedOption.label) {
      setSelectedOption(null);
    }
    
    if (value.length >= minSearchLength) {
      onSearch(value);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleOptionSelect = (option: Option) => {
    setSelectedOption(option);
    setSearchQuery(option.label);
    setIsOpen(false);
    setIsUserTyping(false);
    onSelect(option);
  };

  const handleClear = () => {
    setSelectedOption(null);
    setSearchQuery("");
    setIsOpen(false);
    setIsUserTyping(false);
    onSelect(null);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    setIsUserTyping(true);
    if (searchQuery.length >= minSearchLength) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay clearing the typing state to allow for option selection
    setTimeout(() => {
      setIsUserTyping(false);
    }, 200);
  };

  const showResults = isOpen && searchQuery.length >= minSearchLength;
  const hasResults = options.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={selectedOption && !isUserTyping ? selectedOption.label : placeholder}
          className="w-full py-2 pl-3 pr-10 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        
        {selectedOption && !isUserTyping && (
          <button
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m14 14-2.9-2.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </span>
      </div>

      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : hasResults ? (
            options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option)}
                className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 focus:bg-gray-50 focus:outline-hidden dark:text-white/90 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
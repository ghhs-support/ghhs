import React, { useState, useEffect } from 'react';
import ComponentCard from './ComponentCard';
import SearchableDropdown from './SearchableDropdown';
import Button from '../ui/button/Button';
import DatePicker from '../form/date-picker';
import Switch from '../form/switch/Switch';

export interface Option {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  type: 'searchable-dropdown' | 'dropdown' | 'text' | 'date-filter'; // Changed from date-range to date-filter
  label: string;
  placeholder?: string;
  allOptionLabel?: string;
  // For static dropdown
  options?: Option[];
  // For searchable dropdown
  onSearch?: (query: string) => Promise<Option[]>;
  // For date filter
  singleDateLabel?: string;
  dateRangeLabel?: string;
  dateFromLabel?: string;
  dateToLabel?: string;
  singleDatePlaceholder?: string;
  dateFromPlaceholder?: string;
  dateToPlaceholder?: string;
  // Common props
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export interface FilterValue {
  [filterId: string]: Option | null | {
    mode?: 'single' | 'range';
    single?: string;
    from?: string;
    to?: string;
  };
}

interface FiltersCardProps {
  title?: string;
  description?: string;
  filters: FilterConfig[];
  values: FilterValue;
  onValuesChange: (values: FilterValue) => void;
  onApply: (values: FilterValue) => void;
  loading?: boolean;
  className?: string;
}

const FiltersCard: React.FC<FiltersCardProps> = ({
  title = "Filters",
  description = "Filter your data",
  filters,
  values,
  onValuesChange,
  onApply,
  loading = false,
  className = ""
}) => {
  const [localValues, setLocalValues] = useState<FilterValue>(values);
  const [appliedValues, setAppliedValues] = useState<FilterValue>(values);
  const [datePickerKey, setDatePickerKey] = useState(0);

  // Sync with external values when they change
  useEffect(() => {
    setLocalValues(values);
    setAppliedValues(values);
  }, [values]);

  const handleFilterChange = (filterId: string, value: Option | null | { mode?: 'single' | 'range'; single?: string; from?: string; to?: string }, autoApply: boolean = false) => {
    const newValues = { ...localValues, [filterId]: value };
    setLocalValues(newValues);
    onValuesChange(newValues);
    
    // Only auto-apply when explicitly requested (e.g., when clearing filters)
    if (autoApply) {
      setAppliedValues(newValues);
      onApply(newValues);
      if (value === null) {
        setDatePickerKey(prev => prev + 1);
      }
    }
  };

  const handleDateFilterChange = (filterId: string, field: 'mode' | 'single' | 'from' | 'to', value: string | 'single' | 'range') => {
    const currentValue = localValues[filterId] as { mode?: 'single' | 'range'; single?: string; from?: string; to?: string } || {};
    
    if (field === 'mode') {
      // When changing mode, clear existing date values
      const newValue = { 
        mode: value as 'single' | 'range',
        single: undefined,
        from: undefined,
        to: undefined
      };
      // Don't auto-apply when changing mode
      handleFilterChange(filterId, newValue, false);
      setDatePickerKey(prev => prev + 1);
    } else {
      // For date values, ensure we preserve the mode and set it correctly
      let newValue;
      
      if (field === 'single') {
        // Ensure mode is set to 'single' when setting single date
        newValue = { 
          ...currentValue, 
          mode: 'single',
          single: value as string,
          // Clear range values when setting single
          from: undefined,
          to: undefined
        };
      } else if (field === 'from' || field === 'to') {
        // Ensure mode is set to 'range' when setting range dates
        newValue = { 
          ...currentValue, 
          mode: 'range',
          [field]: value as string,
          // Clear single value when setting range
          single: undefined
        };
      } else {
        newValue = { ...currentValue, [field]: value as string };
      }
      
      console.log(`Setting date filter - Field: ${field}, Value: ${value}, New Value:`, newValue);
      // Don't auto-apply when setting date values
      handleFilterChange(filterId, newValue, false);
    }
  };

  // Helper function to get local date string from Date object
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApply = () => {
    setAppliedValues(localValues);
    onApply(localValues);
  };

  const handleClear = () => {
    const clearedValues: FilterValue = {};
    filters.forEach(filter => {
      clearedValues[filter.id] = null;
    });
    setLocalValues(clearedValues);
    setAppliedValues(clearedValues);
    onValuesChange(clearedValues);
    onApply(clearedValues);
    setDatePickerKey(prev => prev + 1);
  };

  // Handle individual filter clear (from dropdown clear buttons or active filter X buttons)
  const handleIndividualFilterClear = (filterId: string) => {
    // Auto-apply when clearing individual filters
    handleFilterChange(filterId, null, true);
  };

  // Check if there are any pending changes (selected but not applied)
  const hasPendingChanges = JSON.stringify(localValues) !== JSON.stringify(appliedValues);

  // Check applied filters (not local values) for active filters display
  const hasActiveFilters = Object.values(appliedValues).some(value => {
    if (value === null || value === undefined) return false;
    
    // For date filters
    if (typeof value === 'object' && ('mode' in value || 'from' in value || 'single' in value)) {
      const dateValue = value as { mode?: 'single' | 'range'; single?: string; from?: string; to?: string };
      return !!(dateValue.single || dateValue.from || dateValue.to);
    }
    
    // For other filters
    return true;
  });

  // Helper function to check if a date filter has values
  const hasDateFilterValues = (dateValue: { mode?: 'single' | 'range'; single?: string; from?: string; to?: string }): boolean => {
    return !!(dateValue.single || dateValue.from || dateValue.to);
  };

  const renderFilter = (filter: FilterConfig) => {
    const value = localValues[filter.id] || null;

    switch (filter.type) {
      case 'searchable-dropdown':
      case 'dropdown':
        return (
          <SearchableDropdown
            key={filter.id}
            label={filter.label}
            value={value as Option | null}
            onChange={(option) => {
              if (option === null) {
                // Auto-apply when clearing dropdown filters
                handleFilterChange(filter.id, option, true);
              } else {
                // Don't auto-apply when selecting dropdown options
                handleFilterChange(filter.id, option, false);
              }
            }}
            options={filter.options}
            onSearch={filter.onSearch}
            placeholder={filter.placeholder}
            allOptionLabel={filter.allOptionLabel}
            loading={filter.loading}
            error={filter.error}
            disabled={filter.disabled}
            showApplyButton={false}
            showClearButton={true}
          />
        );
      case 'date-filter':
        const dateValue = value as { mode?: 'single' | 'range'; single?: string; from?: string; to?: string } || { mode: 'single' };
        const currentMode = dateValue.mode || 'single';
        
        return (
          <div key={filter.id} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {filter.label}
            </label>
            
            {/* Toggle between single date and date range */}
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${currentMode === 'single' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {filter.singleDateLabel || 'Single Date'}
              </span>
              <Switch
                checked={currentMode === 'range'}
                onChange={(checked) => handleDateFilterChange(filter.id, 'mode', checked ? 'range' : 'single')}
                className="mx-2"
              />
              <span className={`text-sm ${currentMode === 'range' ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                {filter.dateRangeLabel || 'Date Range'}
              </span>
            </div>

            {/* Date picker(s) based on mode */}
            <div className="space-y-2">
              {currentMode === 'single' ? (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <DatePicker
                      key={`${filter.id}-single-${datePickerKey}`}
                      id={`${filter.id}-single`}
                      placeholder={filter.singleDatePlaceholder || "Select date"}
                      defaultDate={dateValue.single}
                      onChange={(selectedDates) => {
                        console.log('Single date picker onChange:', selectedDates);
                        if (selectedDates.length > 0) {
                          const selectedDate = selectedDates[0];
                          const localDateString = getLocalDateString(selectedDate);
                          console.log('Selected date object:', selectedDate);
                          console.log('Converted to local date string:', localDateString);
                          handleDateFilterChange(filter.id, 'single', localDateString);
                        } else {
                          handleDateFilterChange(filter.id, 'single', '');
                        }
                      }}
                    />
                  </div>
                  {/* Clear button inline with single date picker */}
                  {hasDateFilterValues(dateValue) && (
                    <button
                      onClick={() => handleIndividualFilterClear(filter.id)}
                      className="h-11 px-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 whitespace-nowrap"
                      title="Clear dates"
                    >
                      Clear
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <DatePicker
                        key={`${filter.id}-from-${datePickerKey}`}
                        id={`${filter.id}-from`}
                        label={filter.dateFromLabel || "From"}
                        placeholder={filter.dateFromPlaceholder || "Select start date"}
                        defaultDate={dateValue.from}
                        onChange={(selectedDates) => {
                          if (selectedDates.length > 0) {
                            const selectedDate = selectedDates[0];
                            const localDateString = getLocalDateString(selectedDate);
                            handleDateFilterChange(filter.id, 'from', localDateString);
                          } else {
                            handleDateFilterChange(filter.id, 'from', '');
                          }
                        }}
                      />
                    </div>
                    {hasDateFilterValues(dateValue) && (
                      <button
                        onClick={() => handleIndividualFilterClear(filter.id)}
                        className="h-11 px-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 whitespace-nowrap"
                        title="Clear dates"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <DatePicker
                        key={`${filter.id}-to-${datePickerKey}`}
                        id={`${filter.id}-to`}
                        label={filter.dateToLabel || "To"}
                        placeholder={filter.dateToPlaceholder || "Select end date"}
                        defaultDate={dateValue.to}
                        onChange={(selectedDates) => {
                          if (selectedDates.length > 0) {
                            const selectedDate = selectedDates[0];
                            const localDateString = getLocalDateString(selectedDate);
                            handleDateFilterChange(filter.id, 'to', localDateString);
                          } else {
                            handleDateFilterChange(filter.id, 'to', '');
                          }
                        }}
                      />
                    </div>
                    <div className="h-11 px-3"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ComponentCard
      title={title}
      desc={description}
      className={className}
    >
      <div className="space-y-4">
        {/* Filters Grid - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filters.map(filter => (
            <div key={filter.id} className="max-w-sm">
              {renderFilter(filter)}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4">
          <Button
            onClick={handleApply}
            className={`px-4 py-2 ${hasPendingChanges 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
            }`}
            disabled={loading}
          >
            Apply Filters
            {hasPendingChanges && (
              <span className="ml-2 w-2 h-2 bg-orange-400 rounded-full inline-block animate-pulse"></span>
            )}
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            className="text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 px-4 py-2"
            disabled={loading}
          >
            Clear Filters
          </Button>
        </div>

        {/* Active Filters Display */}
        <div className="pt-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Active Filters:</span>
            {!hasActiveFilters ? (
              <span className="text-gray-500 dark:text-gray-400 italic">None</span>
            ) : (
              <div className="flex flex-wrap gap-2 ml-2">
                {Object.entries(appliedValues).map(([filterId, value]) => {
                  if (!value) return null;
                  const filter = filters.find(f => f.id === filterId);
                  if (!filter) return null;

                  let displayText = '';
                  
                  // Handle date-filter type
                  if (filter.type === 'date-filter' && typeof value === 'object' && ('mode' in value || 'from' in value || 'single' in value)) {
                    const dateValue = value as { mode?: 'single' | 'range'; single?: string; from?: string; to?: string };
                    
                    // Only show if there are actual date values
                    if (!hasDateFilterValues(dateValue)) {
                      return null;
                    }
                    
                    // Check for single date (either explicit mode or if single value exists)
                    if ((dateValue.mode === 'single' && dateValue.single) || (dateValue.single && !dateValue.from && !dateValue.to)) {
                      // Format date for display (convert YYYY-MM-DD to DD/MM/YYYY)
                      const [year, month, day] = dateValue.single.split('-');
                      const formattedDate = `${day}/${month}/${year}`;
                      displayText = `${filter.label}: ${formattedDate}`;
                    } 
                    // Check for date range
                    else if (dateValue.from || dateValue.to) {
                      const formatDate = (dateStr: string) => {
                        const [year, month, day] = dateStr.split('-');
                        return `${day}/${month}/${year}`;
                      };
                      
                      if (dateValue.from && dateValue.to) {
                        displayText = `${filter.label}: ${formatDate(dateValue.from)} to ${formatDate(dateValue.to)}`;
                      } else if (dateValue.from) {
                        displayText = `${filter.label}: From ${formatDate(dateValue.from)}`;
                      } else if (dateValue.to) {
                        displayText = `${filter.label}: Until ${formatDate(dateValue.to)}`;
                      }
                    }
                  }
                  // Handle regular dropdown/searchable-dropdown filters
                  else if (value && typeof value === 'object' && 'label' in value) {
                    displayText = `${filter.label}: ${value.label}`;
                  }

                  if (!displayText) return null;

                  return (
                    <div
                      key={filterId}
                      className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 rounded-md px-3 py-1 border border-blue-200 dark:border-blue-800"
                    >
                      <span className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                        {displayText}
                      </span>
                      <button
                        onClick={() => handleIndividualFilterClear(filterId)}
                        className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 ml-1"
                        aria-label={`Remove ${filter.label} filter`}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ComponentCard>
  );
};

export default FiltersCard; 
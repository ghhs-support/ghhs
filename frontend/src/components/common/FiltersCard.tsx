import React, { useState, useEffect } from 'react';
import ComponentCard from './ComponentCard';
import SearchableDropdown from './SearchableDropdown';
import Button from '../ui/button/Button';

export interface Option {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  type: 'searchable-dropdown' | 'dropdown' | 'text'; // Can extend with more types
  label: string;
  placeholder?: string;
  allOptionLabel?: string;
  // For static dropdown
  options?: Option[];
  // For searchable dropdown
  onSearch?: (query: string) => Promise<Option[]>;
  // Common props
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export interface FilterValue {
  [filterId: string]: Option | null;
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

  // Sync with external values when they change
  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleFilterChange = (filterId: string, value: Option | null) => {
    const newValues = { ...localValues, [filterId]: value };
    setLocalValues(newValues);
    onValuesChange(newValues);
    
    // Auto-apply filters when a filter is cleared (becomes null)
    if (value === null) {
      onApply(newValues);
    }
  };

  const handleApply = () => {
    onApply(localValues);
  };

  const handleClear = () => {
    const clearedValues: FilterValue = {};
    filters.forEach(filter => {
      clearedValues[filter.id] = null;
    });
    setLocalValues(clearedValues);
    onValuesChange(clearedValues);
    onApply(clearedValues);
  };

  const hasActiveFilters = Object.values(localValues).some(value => value !== null);

  const renderFilter = (filter: FilterConfig) => {
    const value = localValues[filter.id] || null;

    switch (filter.type) {
      case 'searchable-dropdown':
      case 'dropdown':
        return (
          <SearchableDropdown
            key={filter.id}
            label={filter.label}
            value={value}
            onChange={(option) => handleFilterChange(filter.id, option)}
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
      // Can add more filter types here in the future
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
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
            disabled={loading}
          >
            Apply Filters
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
                {Object.entries(localValues).map(([filterId, value]) => {
                  if (!value) return null;
                  const filter = filters.find(f => f.id === filterId);
                  if (!filter) return null;

                  return (
                    <div
                      key={filterId}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-md px-2 py-1"
                    >
                      <span className="text-xs text-gray-700 dark:text-gray-200">
                        {filter.label}: {value.label}
                      </span>
                      <button
                        onClick={() => handleFilterChange(filterId, null)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
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
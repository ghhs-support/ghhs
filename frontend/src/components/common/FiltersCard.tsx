import React from 'react';
import ComponentCard from './ComponentCard';
import Button from '../ui/button/Button';

export interface Option {
  value: string;
  label: string;
}

export interface FilterValue {
  [filterId: string]: Option | null | {
    mode?: 'single' | 'range';
    single?: string;
    from?: string;
    to?: string;
  };
}

interface LayoutFiltersCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  activeFilters?: Array<{
    id: string;
    label: string;
    value: string;
    onClear: () => void;
  }>;
  onApply: () => void;
  onClearAll: () => void;
  applyDisabled?: boolean;
  clearAllDisabled?: boolean;
  loading?: boolean;
  className?: string;
}

const LayoutFiltersCard: React.FC<LayoutFiltersCardProps> = ({
  title = "Filters",
  description = "Filter your data",
  children,
  activeFilters = [],
  onApply,
  onClearAll,
  applyDisabled = false,
  clearAllDisabled = false,
  loading = false,
  className = ""
}) => {
  const hasActiveFilters = activeFilters.length > 0;

  return (
    <ComponentCard
      title={title}
      desc={description}
      className={className}
    >
      <div className="space-y-4">
        {/* Filter inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children}
        </div>

        {/* Action buttons */}
        <div className="flex justify-start gap-2">
          <Button
            variant="outline"
            onClick={onClearAll}
            disabled={clearAllDisabled}
          >
            Clear All
          </Button>
          <Button
            variant="primary"
            onClick={onApply}
            disabled={applyDisabled}
          >
            Apply Filters
          </Button>
        </div>

        {/* Separator line */}
        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Active filters section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Filters:
          </h3>
          {hasActiveFilters ? (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full dark:bg-blue-900/20 dark:text-blue-300"
                >
                  <span className="font-medium">{filter.label}:</span>
                  <span>{filter.value}</span>
                  <button
                    onClick={filter.onClear}
                    className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    title="Clear filter"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No active filters
            </p>
          )}
        </div>
      </div>
    </ComponentCard>
  );
};

export default LayoutFiltersCard;
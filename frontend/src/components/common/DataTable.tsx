import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

export interface SortField {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  // Data and API
  data: T[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  entriesPerPage: string;
  
  // Callbacks
  onPageChange: (page: number) => void;
  onEntriesPerPageChange: (entries: string) => void;
  onSearchChange: (search: string) => void;
  onSort: (field: string) => void;
  
  // Configuration
  sortFields: SortField[];
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  searchTerm: string;
  searchPlaceholder?: string;
  
  // Custom renderers
  renderRow: (item: T, index: number) => ReactNode;
  renderEmptyState?: ReactNode;
  renderLoadingState?: ReactNode;
  
  // Table configuration
  tableHeight?: string;
  showEntriesSelector?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
}

export default function DataTable<T>({
  data,
  loading,
  error,
  totalCount,
  totalPages,
  currentPage,
  entriesPerPage,
  onPageChange,
  onEntriesPerPageChange,
  onSearchChange,
  onSort,
  sortFields,
  sortField,
  sortDirection,
  searchTerm,
  searchPlaceholder = "Search...",
  renderRow,
  renderEmptyState,
  renderLoadingState,
  tableHeight = "432px",
  showEntriesSelector = true,
  showSearch = true,
  showPagination = true,
}: DataTableProps<T>) {
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
  }, [onSearchChange]);

  const handleSort = (fieldKey: string) => {
    onSort(fieldKey);
  };

  const SortArrow = ({ fieldKey }: { fieldKey: string }) => {
    if (sortField !== fieldKey) {
      return (
        <span className="text-gray-400 dark:text-gray-500">
          <svg className="w-3 h-3 ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 12l6-6 6 6M8 18l6-6 6 6"/>
          </svg>
        </span>
      );
    }
    return sortDirection === 'asc' ? (
      <span className="text-gray-700 dark:text-gray-200">
        <svg className="w-3 h-3 ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 12l6-6 6 6"/>
        </svg>
      </span>
    ) : (
      <span className="text-gray-700 dark:text-gray-200">
        <svg className="w-3 h-3 ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 18l6-6 6 6"/>
        </svg>
      </span>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const endIndex = startIndex + data.length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] shadow-lg">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
        {/* Entries Selector */}
        {showEntriesSelector && (
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400">Show</span>
            <div className="relative z-20 bg-transparent">
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  onEntriesPerPageChange(e.target.value);
                  onPageChange(1);
                }}
                className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              >
                <option value="10" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">10</option>
                <option value="25" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">25</option>
                <option value="50" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">50</option>
                <option value="100" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">100</option>
                <option value="200" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">200</option>
              </select>
              <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">entries</span>
          </div>
        )}
        
        {/* Search */}
        {showSearch && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Search:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                    className="w-64 py-2 pl-3 pr-10 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="m14 14-2.9-2.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
              {searchTerm && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    onPageChange(1);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 self-end mr-2"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="max-w-full overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <div 
            className="overflow-y-auto custom-scrollbar"
            style={{ 
              maxHeight: tableHeight,
              minHeight: tableHeight 
            }}
          >
            <Table>
              <TableHeader className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                <TableRow>
                  {sortFields.map((field, index) => (
                    <TableCell
                      key={field.key}
                      isHeader
                      className={`${field.width || 'w-auto'} px-5 py-4 font-semibold text-gray-700 dark:text-gray-200 text-base border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 whitespace-nowrap ${
                        field.sortable !== false ? 'cursor-pointer' : ''
                      } ${
                        index === 0 ? 'first:rounded-tl-xl' : ''
                      } ${
                        index === sortFields.length - 1 ? 'last:rounded-tr-xl border-r-0' : ''
                      }`}
                      onClick={() => field.sortable !== false && handleSort(field.key)}
                    >
                      <div className={`flex items-center ${
                        field.align === 'center' ? 'justify-center' : 
                        field.align === 'right' ? 'justify-end' : 'justify-start'
                      }`}>
                        {field.label}
                        {field.sortable !== false && <SortArrow fieldKey={field.key} />}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={sortFields.length} className="px-3 py-8 text-center">
                      {renderLoadingState || (
                        <div className="flex items-center justify-center h-[360px]">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={sortFields.length} className="px-3 py-8 text-center">
                      {renderEmptyState || (
                        <div className="flex items-center justify-center h-[360px] text-gray-500 dark:text-gray-400">
                          No data found
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => renderRow(item, index))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {data.length > 0 ? startIndex + 1 : 0} to {endIndex} of {totalCount} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
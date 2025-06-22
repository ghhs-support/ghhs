import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

import Badge from "../ui/badge/Badge";
import { format } from "date-fns";
import { useState, useEffect, useCallback, useRef } from "react";

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

interface AlarmBasicTableProps {
  alarms: Alarm[];
  onPageChange?: (page: number, pageSize: number) => void;
  totalCount?: number;
  loading?: boolean;
  currentPage?: number;
  onSearchChange?: (search: string) => void;
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
}

export default function AlarmBasicTable({ 
  alarms, 
  onPageChange,
  totalCount = 0,
  loading = false,
  currentPage: externalPage = 1,
  onSearchChange
}: AlarmBasicTableProps) {
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(externalPage);
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPages = Math.ceil(totalCount / parseInt(entriesPerPage));
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Update current page when externalPage changes
  useEffect(() => {
    setCurrentPage(externalPage);
  }, [externalPage]);

  // Debounced search function
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(value);
      }
    }, 500); // 500ms delay
  }, [onSearchChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleEntriesPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = e.target.value;
    setEntriesPerPage(newSize);
    setCurrentPage(1);
    onPageChange?.(1, parseInt(newSize));
  }, [onPageChange]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage, parseInt(entriesPerPage));
    }
  }, [currentPage, entriesPerPage, onPageChange]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage, parseInt(entriesPerPage));
    }
  }, [currentPage, entriesPerPage, onPageChange, totalPages]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedAlarms = () => {
    if (!sortField) return alarms;

    return [...alarms].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'address':
          aValue = formatAddress(a).toLowerCase();
          bValue = formatAddress(b).toLowerCase();
          break;
        case 'contact':
          aValue = a.who_contacted.toLowerCase();
          bValue = b.who_contacted.toLowerCase();
          break;
        case 'work_order':
          aValue = (a.work_order_number || '').toLowerCase();
          bValue = (b.work_order_number || '').toLowerCase();
          break;
        case 'stage':
          aValue = a.stage.toLowerCase();
          bValue = b.stage.toLowerCase();
          break;
        case 'brand':
          aValue = a.brand.toLowerCase();
          bValue = b.brand.toLowerCase();
          break;
        case 'tenant':
          aValue = formatTenants(a.tenants).toLowerCase();
          bValue = formatTenants(b.tenants).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue === bValue) return 0;
      
      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const SortArrow = ({ field }: { field: string }) => {
    if (sortField !== field) {
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

  const getStatusColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'quote_sent':
        return 'warning';
      case 'to_be_called':
        return 'info';
      case 'to_be_booked':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const formatAddress = (alarm: Alarm) => {
    const parts = [
      alarm.street_number && alarm.street_name ? `${alarm.street_number}, ${alarm.street_name}` : null,
      alarm.suburb,
      alarm.state,
      alarm.postal_code,
      alarm.country === 'Australia' ? null : alarm.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatTenants = (tenants: Tenant[]) => {
    return tenants.map(t => t.name).join(', ');
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

  const handleRowClick = (alarmId: number) => {
    // Open in new tab using window.open
    window.open(`/alarms/${alarmId}`, '_blank');
  };

  // Add keyboard handler for accessibility
  const handleKeyDown = (event: React.KeyboardEvent<Element>, alarmId: number) => {
    // Open in new tab when pressing Enter or Space
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRowClick(alarmId);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400">Show</span>
          <div className="relative z-20 bg-transparent">
            <select
              value={entriesPerPage}
              onChange={handleEntriesPerPageChange}
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
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by address, contact, work order, tenant..."
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
                  setSearchTerm('');
                  if (onSearchChange) {
                    onSearchChange('');
                  }
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 self-end mr-2"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-hidden">
        <div className="overflow-x-auto">
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.03]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="w-24 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      <SortArrow field="date" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-64 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('address')}
                  >
                    <div className="flex items-center">
                      Address
                      <SortArrow field="address" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-40 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('contact')}
                  >
                    <div className="flex items-center">
                      Contact
                      <SortArrow field="contact" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-32 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('work_order')}
                  >
                    <div className="flex items-center">
                      Work Order
                      <SortArrow field="work_order" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-32 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('stage')}
                  >
                    <div className="flex items-center">
                      Stage
                      <SortArrow field="stage" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-24 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('brand')}
                  >
                    <div className="flex items-center">
                      Brand
                      <SortArrow field="brand" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-48 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('tenant')}
                  >
                    <div className="flex items-center">
                      Tenant
                      <SortArrow field="tenant" />
                    </div>
                  </TableCell>
                </TableRow>
              </TableHeader>
            </Table>
          </div>

          <div className="overflow-y-auto max-h-[432px] min-h-[432px]">
            <Table>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center h-[360px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : alarms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center h-[360px] text-gray-500 dark:text-gray-400">
                        No alarms found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  getSortedAlarms().map((alarm) => (
                    <TableRow 
                      key={alarm.id} 
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => handleRowClick(alarm.id)}
                      onKeyDown={(e) => handleKeyDown(e, alarm.id)}
                      tabIndex={0}
                      role="link"
                      aria-label={`View details for alarm at ${formatAddress(alarm)}`}
                    >
                      <TableCell className="w-24 px-3 py-2 text-start">
                        <span className="text-theme-xs font-medium text-gray-800 dark:text-white/90">
                          {formatDate(alarm.date)}
                        </span>
                      </TableCell>
                      <TableCell className="w-64 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {formatAddress(alarm)}
                        </span>
                      </TableCell>
                      <TableCell className="w-40 px-3 py-2 text-start">
                        <div className="space-y-0.5">
                          <div className="text-theme-xs font-medium text-gray-800 dark:text-white/90">
                            {alarm.who_contacted}
                          </div>
                          <div className="text-theme-xs text-gray-500 dark:text-gray-400">
                            {alarm.contact_method}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="w-32 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {alarm.work_order_number || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="w-32 px-3 py-2 text-start">
                        <div className="w-24 whitespace-nowrap">
                          <Badge
                            size="xs"
                            variant="light"
                            color={getStatusColor(alarm.stage)}
                          >
                            {alarm.stage.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="w-24 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {alarm.brand.charAt(0).toUpperCase() + alarm.brand.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="w-48 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {formatTenants(alarm.tenants)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/[0.05]">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {alarms.length > 0 ? (currentPage - 1) * parseInt(entriesPerPage) + 1 : 0} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

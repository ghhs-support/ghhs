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
}

interface AlarmBasicTableProps {
  alarms: Alarm[];
  onPageChange?: (page: number, pageSize: number) => void;
  totalCount?: number;
  loading?: boolean;
  currentPage?: number;
  onSearchChange?: (search: string) => void;
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
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Date
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Address
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Contact
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Work Order
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Stage
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Tenant
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="px-3 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : alarms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                  No alarms found
                </TableCell>
              </TableRow>
            ) : (
              alarms.map((alarm) => (
                <TableRow key={alarm.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <TableCell className="px-3 py-2 text-start">
                    <span className="text-theme-xs font-medium text-gray-800 dark:text-white/90">
                      {formatDate(alarm.date)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-start">
                    <span className="text-theme-xs text-gray-800 dark:text-white/90">
                      {formatAddress(alarm)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-start">
                    <div className="space-y-0.5">
                      <div className="text-theme-xs font-medium text-gray-800 dark:text-white/90">
                        {alarm.who_contacted}
                      </div>
                      <div className="text-theme-xs text-gray-500 dark:text-gray-400">
                        {alarm.contact_method}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-start">
                    <span className="text-theme-xs text-gray-800 dark:text-white/90">
                      {alarm.work_order_number || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-start">
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
                  <TableCell className="px-3 py-2 text-start">
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

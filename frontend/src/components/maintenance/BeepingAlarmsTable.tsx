import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthenticatedApi } from '../../hooks/useAuthenticatedApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { BeepingAlarm } from "../../types/maintenance";

export default function BeepingAlarmsTable() {
  const { authenticatedGet } = useAuthenticatedApi();
  const [beepingAlarms, setBeepingAlarms] = useState<BeepingAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAlarms = useCallback(async (page: number, pageSize: number, search: string = "") => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (search) {
        queryParams.append('search', search);
      }

      const response = await authenticatedGet(`/beeping_alarms?${queryParams.toString()}`);
      setBeepingAlarms(response.results);
      setTotalCount(response.count);
      setError(null);
    } catch (err) {
      console.error('Error fetching alarms:', err);
      setError('Failed to load alarms');
    } finally {
      setLoading(false);
    }
  }, [authenticatedGet]);

  useEffect(() => {
    fetchAlarms(currentPage, parseInt(entriesPerPage), searchTerm);
  }, [fetchAlarms, currentPage, entriesPerPage]);

  // Debounced search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchAlarms(1, parseInt(entriesPerPage), value);
    }, 500);
  }, [fetchAlarms, entriesPerPage]);

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
    fetchAlarms(1, parseInt(newSize), searchTerm);
  }, [fetchAlarms, searchTerm]);

  const totalPages = Math.ceil(totalCount / parseInt(entriesPerPage));

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchAlarms(newPage, parseInt(entriesPerPage), searchTerm);
    }
  }, [currentPage, entriesPerPage, fetchAlarms, searchTerm]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchAlarms(newPage, parseInt(entriesPerPage), searchTerm);
    }
  }, [currentPage, entriesPerPage, fetchAlarms, searchTerm, totalPages]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return <Badge size="sm" color="info">New</Badge>;
      case 'requires_call_back':
        return <Badge size="sm" color="warning">Requires Call Back</Badge>;
      case 'awaiting_response':
        return <Badge size="sm" color="warning">Awaiting Response</Badge>;
      case 'to_be_scheduled':
        return <Badge size="sm" color="warning">To Be Scheduled</Badge>;
      case 'to_be_quoted':
        return <Badge size="sm" color="warning">To Be Quoted</Badge>;
      case 'completed':
        return <Badge size="sm" color="success">Completed</Badge>;
      case 'cancelled':
        return <Badge size="sm" color="error">Cancelled</Badge>;
      default:
        return <Badge size="sm" color="error">{status || 'Unknown'}</Badge>;
    }
  };

  const formatPropertyAddress = (property: any) => {
    if (!property) {
      return 'No property data';
    }
    
    const parts = [
      property.unit_number && `Unit ${property.unit_number}`,
      property.street_number,
      property.street_name,
      property.suburb,
      property.state,
      property.postcode
    ].filter(Boolean);
    
    const address = parts.join(' ');
    return address || 'No address data';
  };

  const formatAllocation = (allocation: BeepingAlarm['allocation']) => {
    if (!allocation || allocation.length === 0) {
      return 'Unassigned';
    }
    
    return allocation
      .map(user => `${user.first_name} ${user.last_name}`.trim() || user.username)
      .join(', ');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

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
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
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
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by address, allocation, notes..."
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
                  setCurrentPage(1);
                  fetchAlarms(1, parseInt(entriesPerPage), '');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 self-end mr-2"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-auto h-[600px]">
          <div className="min-w-[1140px]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[150px]"
                  >
                    Allocation
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[120px]"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[200px]"
                  >
                    Notes
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[120px]"
                  >
                    Agency/Private
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[150px]"
                  >
                    Customer Contacted
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[250px]"
                  >
                    Property
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-[150px]"
                  >
                    Created At
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-[600px] px-5 py-8">
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : beepingAlarms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-[600px] px-5 py-8">
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        No beeping alarms found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  beepingAlarms.map((alarm, index) => (
                    <TableRow 
                      key={alarm.id}
                      className={`
                        ${index % 2 === 0 ? 'bg-white dark:bg-white/[0.02]' : 'bg-gray-50 dark:bg-white/[0.01]'}
                        hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors duration-150 ease-in-out cursor-pointer
                      `}
                    >
                      <TableCell className="px-5 py-4 sm:px-6 text-start w-[150px]">
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {formatAllocation(alarm.allocation)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-[120px]">
                        {getStatusBadge(alarm.status)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-[200px]">
                        <div className="max-w-xs truncate" title={alarm.notes}>
                          {alarm.notes}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-[120px]">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {alarm.is_agency ? 'Agency' : 'Private'}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-[150px]">
                        <Badge 
                          size="sm" 
                          color={alarm.is_customer_contacted ? "success" : "warning"}
                        >
                          {alarm.is_customer_contacted ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-[250px]">
                        <div className="max-w-xs truncate" title={formatPropertyAddress(alarm.property)}>
                          {formatPropertyAddress(alarm.property)}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 w-[150px]">
                        {new Date(alarm.created_at).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
          Showing {beepingAlarms.length > 0 ? (currentPage - 1) * parseInt(entriesPerPage) + 1 : 0} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
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

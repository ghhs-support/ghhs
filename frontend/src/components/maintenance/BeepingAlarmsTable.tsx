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
import { format } from "date-fns";

type SortField = 'allocation' | 'status' | 'notes' | 'agency_private' | 'customer_contacted' | 'property' | 'created_at';

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: BeepingAlarm[];
  total_pages: number;
  current_page: number;
}

export default function BeepingAlarmsTable() {
  const { authenticatedGet } = useAuthenticatedApi();
  const [beepingAlarms, setBeepingAlarms] = useState<BeepingAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchAlarms = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: entriesPerPage,
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await authenticatedGet(`/beeping_alarms?${params.toString()}`);
      const paginatedResponse = response as PaginatedResponse;
      
      setBeepingAlarms(paginatedResponse.results);
      setTotalCount(paginatedResponse.count);
      setTotalPages(paginatedResponse.total_pages);
      setError(null);
    } catch (err) {
      console.error('Error fetching alarms:', err);
      setError('Failed to load alarms');
    } finally {
      setLoading(false);
    }
  }, [authenticatedGet, currentPage, entriesPerPage, searchTerm]);

  useEffect(() => {
    fetchAlarms();
  }, [fetchAlarms]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortArrow = ({ field }: { field: SortField }) => {
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

  // Client-side sorting function
  const getSortedAlarms = () => {
    if (!sortField) {
      return beepingAlarms;
    }

    return [...beepingAlarms].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'allocation':
          aValue = a.allocation?.[0]?.first_name || '';
          bValue = b.allocation?.[0]?.first_name || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'notes':
          aValue = a.notes || '';
          bValue = b.notes || '';
          break;
        case 'agency_private':
          aValue = a.is_agency ? 'Agency' : 'Private';
          bValue = b.is_agency ? 'Agency' : 'Private';
          break;
        case 'customer_contacted':
          aValue = a.is_customer_contacted;
          bValue = b.is_customer_contacted;
          break;
        case 'property':
          aValue = `${a.property?.street_number || ''} ${a.property?.street_name || ''}`;
          bValue = `${b.property?.street_number || ''} ${b.property?.street_name || ''}`;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aValue === bValue) return 0;
      
      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const sortedAlarms = getSortedAlarms();

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy');
  };

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

  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const endIndex = startIndex + sortedAlarms.length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 dark:text-gray-400">Show</span>
          <div className="relative z-20 bg-transparent">
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(e.target.value);
                setCurrentPage(1);
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
                    className="w-40 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('allocation')}
                  >
                    <div className="flex items-center">
                      Allocation
                      <SortArrow field="allocation" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-32 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <SortArrow field="status" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-64 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('notes')}
                  >
                    <div className="flex items-center">
                      Notes
                      <SortArrow field="notes" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-32 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('agency_private')}
                  >
                    <div className="flex items-center">
                      Agency/Private
                      <SortArrow field="agency_private" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-40 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('customer_contacted')}
                  >
                    <div className="flex items-center">
                      Customer Contacted
                      <SortArrow field="customer_contacted" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-64 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('property')}
                  >
                    <div className="flex items-center">
                      Property
                      <SortArrow field="property" />
                    </div>
                  </TableCell>
                  <TableCell
                    isHeader
                    className="w-32 px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Created At
                      <SortArrow field="created_at" />
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
                    <TableCell colSpan={7} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center h-[360px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedAlarms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-3 py-8 text-center">
                      <div className="flex items-center justify-center h-[360px] text-gray-500 dark:text-gray-400">
                        No beeping alarms found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAlarms.map((alarm) => (
                    <TableRow 
                      key={alarm.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <TableCell className="w-40 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {formatAllocation(alarm.allocation)}
                        </span>
                      </TableCell>
                      <TableCell className="w-32 px-3 py-2 text-start">
                        <div className="w-24 whitespace-nowrap">
                          {getStatusBadge(alarm.status)}
                        </div>
                      </TableCell>
                      <TableCell className="w-64 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {alarm.notes || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="w-32 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {alarm.is_agency ? 'Agency' : 'Private'}
                        </span>
                      </TableCell>
                      <TableCell className="w-40 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {alarm.is_customer_contacted ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell className="w-64 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {formatPropertyAddress(alarm.property)}
                        </span>
                      </TableCell>
                      <TableCell className="w-32 px-3 py-2 text-start">
                        <span className="text-theme-xs text-gray-800 dark:text-white/90">
                          {formatDate(alarm.created_at)}
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
          Showing {sortedAlarms.length > 0 ? startIndex + 1 : 0} to {endIndex} of {totalCount} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

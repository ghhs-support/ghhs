import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { BeepingAlarm } from "../../types/maintenance";
import { format, parseISO } from "date-fns";
import DataTable, { SortField } from "../common/DataTable";
import { useDataTable } from "../../hooks/useDataTable";

interface BeepingAlarmsTableProps {
  allocationFilter: string | null;
  tenantFilter: string | null;
  statusFilter: string | null;
  customerContactedFilter: string | null;
  propertyFilter: string | null;
  agencyPrivateFilter: string | null;
  createdAtSingleFilter: string | null;
  createdAtFromFilter: string | null;
  createdAtToFilter: string | null;
  createdAtMode: 'single' | 'range';
}

const BeepingAlarmsTable: React.FC<BeepingAlarmsTableProps> = ({ 
  allocationFilter, 
  tenantFilter, 
  statusFilter,
  customerContactedFilter,
  propertyFilter,
  agencyPrivateFilter,
  createdAtSingleFilter,
  createdAtFromFilter,
  createdAtToFilter,
  createdAtMode
}) => {
  const navigate = useNavigate();
  // Local state for client-side sorting
  const [localSortField, setLocalSortField] = useState<string | null>('created_at');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('desc');

  // Helper function to create proper UTC timestamps for GMT+10 dates
  const createGMT10DateRangeForBackend = (dateString: string, isEndDate: boolean = false) => {
    // Parse the YYYY-MM-DD string
    const [year, month, day] = dateString.split('-').map(Number);
    
    if (isEndDate) {
      // End of day in GMT+10: 23:59:59.999 on the selected date
      // Create the date in UTC directly by specifying what time it would be in UTC
      // July 2nd 23:59:59 GMT+10 = July 2nd 13:59:59 UTC
      const utcDate = new Date(Date.UTC(year, month - 1, day, 13, 59, 59, 999));
      return utcDate.toISOString();
    } else {
      // Start of day in GMT+10: 00:00:00.000 on the selected date
      // July 2nd 00:00:00 GMT+10 = July 1st 14:00:00 UTC
      const utcDate = new Date(Date.UTC(year, month - 1, day - 1, 14, 0, 0, 0));
      return utcDate.toISOString();
    }
  };

  // Memoize the filters object
  const filters = useMemo(() => {
    let createdAtFilters = {};
    
    if (createdAtMode === 'single' && createdAtSingleFilter) {
      // For single date, create a range for the entire day in GMT+10
      const startISO = createGMT10DateRangeForBackend(createdAtSingleFilter, false);
      const endISO = createGMT10DateRangeForBackend(createdAtSingleFilter, true);
      
      console.log(`Single date filter (GMT+10): ${createdAtSingleFilter}`);
      console.log(`Start of ${createdAtSingleFilter} GMT+10 in UTC: ${startISO}`);
      console.log(`End of ${createdAtSingleFilter} GMT+10 in UTC: ${endISO}`);
      
      createdAtFilters = {
        created_at_from: startISO,
        created_at_to: endISO
      };
    } else if (createdAtMode === 'range') {
      if (createdAtFromFilter) {
        const startISO = createGMT10DateRangeForBackend(createdAtFromFilter, false);
        console.log(`From date filter (GMT+10): ${createdAtFromFilter} -> UTC: ${startISO}`);
        createdAtFilters = { 
          ...createdAtFilters, 
          created_at_from: startISO
        };
      }
      if (createdAtToFilter) {
        const endISO = createGMT10DateRangeForBackend(createdAtToFilter, true);
        console.log(`To date filter (GMT+10): ${createdAtToFilter} -> UTC: ${endISO}`);
        createdAtFilters = { 
          ...createdAtFilters, 
          created_at_to: endISO
        };
      }
    }

    return {
      allocation: allocationFilter,
      tenant: tenantFilter,
      status: statusFilter,
      is_customer_contacted: customerContactedFilter,
      property: propertyFilter,
      agency_private: agencyPrivateFilter,
      ...createdAtFilters
    };
  }, [
    allocationFilter, 
    tenantFilter, 
    statusFilter, 
    customerContactedFilter, 
    propertyFilter, 
    agencyPrivateFilter,
    createdAtSingleFilter,
    createdAtFromFilter,
    createdAtToFilter,
    createdAtMode
  ]);

  const {
    data: beepingAlarms,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    entriesPerPage,
    searchTerm,
    handleSearchChange,
    handlePageChange,
    handleEntriesPerPageChange,
  } = useDataTable<BeepingAlarm>({
    endpoint: '/beeping_alarms/',
    defaultEntriesPerPage: '10',
    filters
  });

  // Handle local sorting
  const handleLocalSort = useCallback((field: string) => {
    if (localSortField === field) {
      // Toggle direction if same field
      setLocalSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setLocalSortField(field);
      setLocalSortDirection('asc');
    }
  }, [localSortField]);

  // Define table columns
  const sortFields: SortField[] = [
    {
      key: 'id',
      label: 'ID',
      width: 'w-20',
      align: 'center'
    },
    {
      key: 'allocation',
      label: 'Allocation',
      width: 'w-40',
      align: 'center'
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-32',
      align: 'center'
    },
    {
      key: 'agency_private',
      label: 'Agency/Private',
      width: 'w-32',
      align: 'center'
    },
    {
      key: 'tenant',
      label: 'Tenant',
      width: 'w-48',
      align: 'center'
    },
    {
      key: 'customer_contacted',
      label: 'Customer Contacted',
      width: 'w-40',
      align: 'center'
    },
    {
      key: 'property',
      label: 'Property',
      width: 'w-64',
      align: 'center'
    },
    {
      key: 'created_at',
      label: 'Created At',
      width: 'w-32',
      align: 'right'
    }
  ];

  // Move formatPropertyAddress up here, before getSortedAlarms
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

  // Now getSortedAlarms can use formatPropertyAddress
  const getSortedAlarms = useCallback(() => {
    if (!localSortField) {
      return beepingAlarms;
    }

    return [...beepingAlarms].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (localSortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        
        case 'allocation':
          aValue = a.allocation?.[0]?.first_name || '';
          bValue = b.allocation?.[0]?.first_name || '';
          // If first names are equal, try last names
          if (aValue === bValue) {
            aValue = a.allocation?.[0]?.last_name || '';
            bValue = b.allocation?.[0]?.last_name || '';
          }
          break;
        
        case 'status':
          const statusOrder: Record<string, number> = {
            'new': 0,
            'requires_call_back': 1,
            'awaiting_response': 2,
            'to_be_scheduled': 3,
            'to_be_quoted': 4,
            'completed': 5,
            'cancelled': 6
          };
          aValue = statusOrder[a.status?.toLowerCase() ?? ''] ?? 999;
          bValue = statusOrder[b.status?.toLowerCase() ?? ''] ?? 999;
          break;
        
        case 'agency_private':
          // Simplify the sorting logic
          aValue = a.property?.is_agency ? 'A' : (a.property?.is_private ? 'B' : 'C');
          bValue = b.property?.is_agency ? 'A' : (b.property?.is_private ? 'B' : 'C');
          break;
        
        case 'tenant':
          // Simplify tenant sorting
          aValue = a.property?.tenants?.[0] ? 
            `${a.property.tenants[0].first_name} ${a.property.tenants[0].last_name}`.toLowerCase() : 'zzz';
          bValue = b.property?.tenants?.[0] ? 
            `${b.property.tenants[0].first_name} ${b.property.tenants[0].last_name}`.toLowerCase() : 'zzz';
          break;
        
        case 'customer_contacted':
          // Simplify boolean sorting
          aValue = a.is_customer_contacted ? 0 : 1;
          bValue = b.is_customer_contacted ? 0 : 1;
          break;
        
        case 'property':
          // Sort by full address
          aValue = formatPropertyAddress(a.property).toLowerCase();
          bValue = formatPropertyAddress(b.property).toLowerCase();
          break;
        
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        
        default:
          return 0;
      }

      // Add null/undefined handling
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return localSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [beepingAlarms, localSortField, localSortDirection, formatPropertyAddress]); // Added formatPropertyAddress to dependencies

  const sortedAlarms = getSortedAlarms();

  // Simplified date formatting - displays in user's local timezone
  const formatDate = (date: string) => {
    try {
      // parseISO correctly handles UTC dates and converts to local timezone
      const parsedDate = parseISO(date);
      return format(parsedDate, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
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

  const getCustomerContactedBadge = (isContacted: boolean) => {
    return isContacted ? 
      <Badge size="sm" color="success">Yes</Badge> : 
      <Badge size="sm" color="error">No</Badge>;
  };

  const getAgencyPrivateBadge = (alarm: BeepingAlarm) => {
    // Handle boolean values from backend
    const isAgency = alarm.property.is_agency === true;
    const isPrivate = alarm.property.is_private === true;
    if (isAgency) {
      return <Badge size="sm" color="info">Agency</Badge>;
    }
    if (isPrivate) {
      return <Badge size="sm" color="success">Private</Badge>;
    }
    return <Badge size="sm" color="error">Unknown</Badge>;
  };

  const formatAllocation = (allocation: BeepingAlarm['allocation']) => {
    if (!allocation || allocation.length === 0) {
      return 'Unassigned';
    }
    
    // If there's only one allocation, return the name as a string
    if (allocation.length === 1) {
      const user = allocation[0];
      return `${user.first_name} ${user.last_name}`.trim() || user.username;
    }
    
    // If there are multiple allocations, show them in a vertical format
    return (
      <div className="flex flex-col items-center">
        <span className="font-medium text-gray-800 dark:text-white/90 text-xs">
          {allocation.length} Assigned
        </span>
        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-full">
          {allocation.map((user, index) => {
            const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            const displayName = name || user.username;
            return (
              <div key={user.id || index} className="truncate">
                {displayName}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatTenant = (tenants: Array<{id: number; first_name: string; last_name: string; phone: string;}>) => {
    if (!tenants || tenants.length === 0) {
      return (
        <Badge size="sm" className="rounded-full bg-gray-700 text-gray-300 font-semibold border-none shadow-none px-4 py-1 mb-1">
          No Tenants
        </Badge>
      );
    }
    // Always show badge with tenant count, then details below
    return (
      <div className="flex flex-col items-center">
        <Badge size="sm" className="rounded-full bg-purple-900/60 text-purple-300 font-semibold border-none shadow-none px-4 py-1 mb-1">
          {tenants.length} {tenants.length === 1 ? 'Tenant' : 'Tenants'}
        </Badge>
        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-full">
          {tenants.map((tenant: {id: number; first_name: string; last_name: string; phone: string;}, index: number) => {
            const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim();
            const displayName = name || 'No name';
            return (
              <div key={tenant.id} className="truncate">
                {displayName}
                {tenant.phone && <span className="block">{tenant.phone}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render individual row
  const renderRow = useCallback((alarm: BeepingAlarm) => (
    <TableRow 
      key={alarm.id}
      className="hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700"
      onClick={() => navigate(`/maintenance/beeping-alarms/${alarm.id}`)}
    >
      <TableCell className="w-20 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap font-medium">
          #{alarm.id}
        </div>
      </TableCell>
      <TableCell className="w-40 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap font-medium">
          {formatAllocation(alarm.allocation)}
        </div>
      </TableCell>
      <TableCell className="w-32 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="mx-auto whitespace-nowrap">
          {getStatusBadge(alarm.status)}
        </div>
      </TableCell>
      <TableCell className="w-32 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="mx-auto whitespace-nowrap">
          {getAgencyPrivateBadge(alarm)}
        </div>
      </TableCell>
      <TableCell className="w-48 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="whitespace-nowrap">
          {formatTenant(alarm.property.tenants)}
        </div>
      </TableCell>
      <TableCell className="w-40 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="mx-auto whitespace-nowrap">
          {getCustomerContactedBadge(alarm.is_customer_contacted)}
        </div>
      </TableCell>
      <TableCell className="w-64 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <span
          className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap"
          title={formatPropertyAddress(alarm.property)}
        >
          {formatPropertyAddress(alarm.property)}
        </span>
      </TableCell>
      <TableCell className="w-40 px-5 py-4 text-center">
        <div className="flex flex-col">
          <span className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap font-medium">
            {format(parseISO(alarm.created_at), 'dd/MM/yyyy')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {format(parseISO(alarm.created_at), 'HH:mm')}
          </span>
        </div>
      </TableCell>
    </TableRow>
  ), [formatAllocation, getStatusBadge, getCustomerContactedBadge, getAgencyPrivateBadge, formatPropertyAddress, formatTenant, navigate]);

  return (
    <DataTable
      data={sortedAlarms}
      loading={loading}
      error={error}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      entriesPerPage={entriesPerPage}
      onPageChange={handlePageChange}
      onEntriesPerPageChange={handleEntriesPerPageChange}
      onSearchChange={handleSearchChange}
      onSort={handleLocalSort}
      sortFields={sortFields}
      sortField={localSortField}
      sortDirection={localSortDirection}
      searchTerm={searchTerm}
      searchPlaceholder="Search by address, allocation, notes..."
      renderRow={renderRow}
      tableHeight="600px"
      serverSideOperations={true} // Add this line
      renderEmptyState={
        <div className="flex items-center justify-center h-[360px] text-gray-500 dark:text-gray-400">
          No beeping alarms found
        </div>
      }
    />
  );
};

export default BeepingAlarmsTable;

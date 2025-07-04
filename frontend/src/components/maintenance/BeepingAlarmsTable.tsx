import { useCallback, useMemo, useState } from 'react';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { BeepingAlarm } from "../../types/maintenance";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
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

  // Client-side sorting function (since backend sorting might not handle all fields)
  const getSortedAlarms = useCallback(() => {
    if (!localSortField) {
      return beepingAlarms;
    }

    return [...beepingAlarms].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (localSortField) {
        case 'allocation':
          aValue = a.allocation?.[0]?.first_name || '';
          bValue = b.allocation?.[0]?.first_name || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'agency_private':
          aValue = a.is_agency ? 'Agency' : 'Private';
          bValue = b.is_agency ? 'Agency' : 'Private';
          break;
        case 'tenant':
          // Sort by first tenant's name, or by tenant count if names are equal
          const aFirstTenant = a.tenant?.[0];
          const bFirstTenant = b.tenant?.[0];
          aValue = aFirstTenant ? `${aFirstTenant.first_name || ''} ${aFirstTenant.last_name || ''}`.trim() : '';
          bValue = bFirstTenant ? `${bFirstTenant.first_name || ''} ${bFirstTenant.last_name || ''}`.trim() : '';
          
          // If names are the same, sort by tenant count
          if (aValue === bValue) {
            aValue = a.tenant?.length || 0;
            bValue = b.tenant?.length || 0;
          }
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
      return localSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [beepingAlarms, localSortField, localSortDirection]);

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

  const getAgencyPrivateBadge = (isAgency: boolean) => {
    return isAgency ? 
      <Badge size="sm" color="info">Agency</Badge> : 
      <Badge size="sm" color="warning">Private</Badge>;
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

  const formatTenant = (tenants: BeepingAlarm['tenant']) => {
    if (!tenants || tenants.length === 0) return 'No tenants';
    
    // If there's only one tenant, show name and phone in a column
    if (tenants.length === 1) {
      const tenant = tenants[0];
      const name = `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim();
      const phone = tenant.phone;
      
      if (!name && !phone) return 'No tenant data';
      
      return (
        <div className="flex flex-col items-center">
          <span className="font-medium text-gray-800 dark:text-white/90">
            {name || 'No name'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {phone || 'No phone'}
          </span>
        </div>
      );
    }
    
    // If there are multiple tenants, show them in a compact format
    return (
      <div className="flex flex-col items-center">
        <span className="font-medium text-gray-800 dark:text-white/90 text-xs">
          {tenants.length} Tenants
        </span>
        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-full">
          {tenants.map((tenant, index) => {
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
    >
      <TableCell className="w-40 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <span className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap font-medium">
          {formatAllocation(alarm.allocation)}
        </span>
      </TableCell>
      <TableCell className="w-32 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="mx-auto whitespace-nowrap">
          {getStatusBadge(alarm.status)}
        </div>
      </TableCell>
      <TableCell className="w-32 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="mx-auto whitespace-nowrap">
          {getAgencyPrivateBadge(alarm.is_agency)}
        </div>
      </TableCell>
      <TableCell className="w-48 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="whitespace-nowrap">
          {formatTenant(alarm.tenant)}
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
  ), [formatAllocation, getStatusBadge, getCustomerContactedBadge, getAgencyPrivateBadge, formatPropertyAddress, formatTenant]);

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
      renderEmptyState={
        <div className="flex items-center justify-center h-[360px] text-gray-500 dark:text-gray-400">
          No beeping alarms found
        </div>
      }
    />
  );
};

export default BeepingAlarmsTable;

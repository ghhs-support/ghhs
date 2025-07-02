import { useCallback, useMemo, useState } from 'react';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { BeepingAlarm } from "../../types/maintenance";
import { format } from "date-fns";
import DataTable, { SortField } from "../common/DataTable";
import { useDataTable } from "../../hooks/useDataTable";

interface BeepingAlarmsTableProps {
  allocationFilter: string | null;
  tenantFilter: string | null;
  statusFilter: string | null;
}

const BeepingAlarmsTable: React.FC<BeepingAlarmsTableProps> = ({ allocationFilter, tenantFilter, statusFilter }) => {
  // Local state for client-side sorting
  const [localSortField, setLocalSortField] = useState<string | null>('created_at');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('desc');

  // Memoize the filters object
  const filters = useMemo(() => ({
    allocation: allocationFilter,
    tenant: tenantFilter,
    status: statusFilter
  }), [allocationFilter, tenantFilter, statusFilter]);

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
          aValue = `${a.tenant?.first_name || ''} ${a.tenant?.last_name || ''}`.trim();
          bValue = `${b.tenant?.first_name || ''} ${b.tenant?.last_name || ''}`.trim();
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

  const formatTenant = (tenant: BeepingAlarm['tenant']) => {
    if (!tenant) return 'No tenant data';
    
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
        <span className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap">
          {alarm.is_agency ? 'Agency' : 'Private'}
        </span>
      </TableCell>
      <TableCell className="w-48 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="whitespace-nowrap">
          {formatTenant(alarm.tenant)}
        </div>
      </TableCell>
      <TableCell className="w-40 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <span className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap">
          {alarm.is_customer_contacted ? 'Yes' : 'No'}
        </span>
      </TableCell>
      <TableCell className="w-64 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <span
          className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap"
          title={formatPropertyAddress(alarm.property)}
        >
          {formatPropertyAddress(alarm.property)}
        </span>
      </TableCell>
      <TableCell className="w-32 px-5 py-4 text-center">
        <span className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap">
          {formatDate(alarm.created_at)}
        </span>
      </TableCell>
    </TableRow>
  ), [formatAllocation, getStatusBadge, formatPropertyAddress, formatDate, formatTenant]);

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

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import DataTable from "../common/DataTable";
import { useDataTable } from "../../hooks/useDataTable";
import {
  Property,
  PROPERTY_TABLE_COLUMNS,
  formatPropertyAddress,
  formatOwnerDisplay,
  Tenant,
  PrivateOwner
} from '../../types/property';

interface PropertiesTableProps {
  filters?: {
    address?: string | null;
    suburb?: string | null;
    state?: string | null;
    postcode?: string | null;
    ownerType?: string | null;
    isActive?: boolean | null;
    agency?: string | null;
    privateOwner?: string | null; // Added missing private owner filter
  };
}

const PropertiesTable: React.FC<PropertiesTableProps> = ({ filters = {} }) => {
  const navigate = useNavigate();
  const [localSortField, setLocalSortField] = useState<string | null>('street_name');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('asc');

  // Convert filters to the format expected by useDataTable
  const tableFilters = {
    ...(filters.address && { address: filters.address }),
    ...(filters.suburb && { suburb: filters.suburb }),
    ...(filters.state && { state: filters.state }),
    ...(filters.postcode && { postcode: filters.postcode }),
    ...(filters.ownerType && { owner_type: filters.ownerType }),
    ...(filters.isActive !== null && { is_active: filters.isActive }),
    ...(filters.agency && { agency: filters.agency }),
    ...(filters.privateOwner && { private_owner: filters.privateOwner }), // Added missing private owner filter
  };

  const {
    data: properties,
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
  } = useDataTable<Property>({
    endpoint: '/properties/properties/',
    defaultEntriesPerPage: '10',
    filters: tableFilters
  });

  const handleLocalSort = useCallback((field: string) => {
    if (localSortField === field) {
      setLocalSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLocalSortField(field);
      setLocalSortDirection('asc');
    }
  }, [localSortField]);

  const getFilteredAndSortedProperties = useCallback(() => {
    if (!properties || !Array.isArray(properties)) {
      return [];
    }

    let filtered = properties;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = properties.filter(property => {
        const address = formatPropertyAddress(property).toLowerCase();
        const owner = formatOwnerDisplay(property).name.toLowerCase();
        return address.includes(searchLower) || owner.includes(searchLower);
      });
    }

    if (!localSortField) {
      return filtered;
    }

    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (localSortField) {
        case 'address':
          aValue = formatPropertyAddress(a).toLowerCase();
          bValue = formatPropertyAddress(b).toLowerCase();
          break;
        case 'owner':
          const aOwnerInfo = formatOwnerDisplay(a);
          const bOwnerInfo = formatOwnerDisplay(b);
          aValue = aOwnerInfo.name.toLowerCase();
          bValue = bOwnerInfo.name.toLowerCase();
          break;
        case 'tenants':
          aValue = a.tenants.length;
          bValue = b.tenants.length;
          break;
        case 'street_name':
          aValue = a.street_name.toLowerCase();
          bValue = b.street_name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return localSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [properties, searchTerm, localSortField, localSortDirection]);

  const sortedProperties = getFilteredAndSortedProperties();

  // Updated renderOwner function to show all private owners like BeepingAlarmsTable
  const renderOwner = (property: Property) => {
    if (property.agency) {
      return (
        <div className="flex flex-col">
          <Badge size="sm" color="info">Agency</Badge>
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
            {property.agency.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {property.agency.email}
          </span>
        </div>
      );
    }

    if (property.private_owners.length > 0) {
      return (
        <div className="flex flex-col">
          <Badge size="sm" color="success">Private</Badge>
          {property.private_owners.length === 1 ? (
            <div>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                {`${property.private_owners[0].first_name} ${property.private_owners[0].last_name}`}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block">
                {property.private_owners[0].email}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-medium text-gray-800 dark:text-white/90 text-xs">
                {property.private_owners.length} Owners
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 max-w-full">
                {property.private_owners.map((owner: PrivateOwner) => (
                  <div key={owner.id} className="truncate">
                    {`${owner.first_name} ${owner.last_name}`}
                    <span className="block">{owner.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        <Badge size="sm" color="error">No Owner</Badge>
        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
          Unassigned
        </span>
      </div>
    );
  };

  // Updated renderTenants function to show all tenants like BeepingAlarmsTable
  const renderTenants = (tenants: Tenant[]) => {
    if (!tenants || tenants.length === 0) {
      return (
        <div className="flex flex-col items-center">
          <Badge size="sm" className="rounded-full bg-gray-700 text-gray-300 font-semibold border-none shadow-none px-4 py-1 mb-1">
            No Tenants
          </Badge>
          <span className="text-sm text-gray-400">Vacant</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        <Badge
          size="sm"
          className="rounded-full bg-purple-900/60 text-purple-300 font-semibold border-none shadow-none px-4 py-1 mb-1"
        >
          {tenants.length} {tenants.length === 1 ? 'Tenant' : 'Tenants'}
        </Badge>
        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-full">
          {tenants.map((tenant: Tenant) => {
            const name = `${tenant.first_name} ${tenant.last_name}`.trim();
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

  const renderRow = useCallback((property: Property) => (
    <TableRow 
      key={property.id}
      className="hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700"
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      <TableCell className="w-64 px-5 py-4 text-left border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
            {formatPropertyAddress(property)}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-48 px-5 py-4 text-left border-r border-gray-200 dark:border-gray-700">
        {renderOwner(property)}
      </TableCell>
      <TableCell className="w-40 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        {renderTenants(property.tenants)}
      </TableCell>
    </TableRow>
  ), [navigate]);

  return (
    <DataTable
      data={sortedProperties}
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
      sortFields={PROPERTY_TABLE_COLUMNS}
      sortField={localSortField}
      sortDirection={localSortDirection}
      searchTerm={searchTerm}
      searchPlaceholder="Search by address, owner, suburb..."
      renderRow={renderRow}
      tableHeight="600px"
      serverSideOperations={true}
      renderEmptyState={
        <div className="flex items-center justify-center h-[360px] text-gray-500 dark:text-gray-400">
          No properties found
        </div>
      }
    />
  );
};

export default PropertiesTable; 
import { useCallback, useMemo, useState } from 'react';
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
  formatTenantsDisplay
} from '../../types/property';

const PropertiesTable: React.FC = () => {
  const navigate = useNavigate();
  const [localSortField, setLocalSortField] = useState<string | null>('street_name');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('asc');

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
    defaultEntriesPerPage: '10'
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

  // Client-side filtering and sorting function
  const getFilteredAndSortedProperties = useCallback(() => {
    if (!properties || !Array.isArray(properties)) {
      return [];
    }

    // First filter by search term
    let filtered = properties;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = properties.filter(property => {
        const address = formatPropertyAddress(property).toLowerCase();
        const owner = formatOwnerDisplay(property).name.toLowerCase();
        return address.includes(searchLower) || owner.includes(searchLower);
      });
    }

    // Then sort
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

  // Keep existing render functions...
  const renderOwner = (ownerInfo: ReturnType<typeof formatOwnerDisplay>) => (
    <div className="flex flex-col">
      <Badge size="sm" color={ownerInfo.type === 'agency' ? 'info' : ownerInfo.type === 'private' ? 'success' : 'error'}>
        {ownerInfo.type === 'agency' ? 'Agency' : ownerInfo.type === 'private' ? 'Private' : 'No Owner'}
      </Badge>
      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
        {ownerInfo.name}
      </span>
      {ownerInfo.email && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {ownerInfo.email}
        </span>
      )}
    </div>
  );

  const renderTenants = (tenantInfo: ReturnType<typeof formatTenantsDisplay>) => (
    <div className="flex flex-col items-start">
      <Badge
        size="sm"
        className={`rounded-full ${
          tenantInfo.isVacant 
            ? 'bg-gray-700 text-gray-300' 
            : 'bg-purple-900/60 text-purple-300'
        } font-semibold border-none shadow-none px-4 py-1 mb-1`}
      >
        {tenantInfo.isVacant 
          ? 'No Tenants' 
          : `${tenantInfo.count} ${tenantInfo.count === 1 ? 'Tenant' : 'Tenants'}`}
      </Badge>
      {tenantInfo.isVacant ? (
        <span className="text-sm text-gray-400">Vacant</span>
      ) : (
        <>
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
            {tenantInfo.primary}
          </span>
          {tenantInfo.count > 1 && (
            <span className="text-sm text-gray-400">
              +{tenantInfo.count - 1} more
            </span>
          )}
        </>
      )}
    </div>
  );

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
        {renderOwner(formatOwnerDisplay(property))}
      </TableCell>
      <TableCell className="w-40 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        {renderTenants(formatTenantsDisplay(property.tenants))}
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
      renderEmptyState={
        <div className="flex items-center justify-center h-[360px] text-gray-500 dark:text-gray-400">
          No properties found
        </div>
      }
    />
  );
};

export default PropertiesTable; 
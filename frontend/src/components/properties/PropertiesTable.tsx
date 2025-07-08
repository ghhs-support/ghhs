import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import DataTable from "../common/DataTable";
import { useAuthenticatedApi } from "../../hooks/useAuthenticatedApi";
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const { authenticatedGet } = useAuthenticatedApi();

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true);
        const response = await authenticatedGet('/properties/properties/');
        setProperties(response || []);
        setTotalCount(response?.length || 0);
        setTotalPages(Math.ceil((response?.length || 0) / parseInt(entriesPerPage)));
        setError(null);
      } catch (err) {
        console.error('Error loading properties:', err);
        setError('Failed to load properties');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [authenticatedGet, entriesPerPage]);



  // Handler functions
  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleEntriesPerPageChange = useCallback((entries: string) => {
    setEntriesPerPage(entries);
    setCurrentPage(1);
  }, []);

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
        const address = `${property.street_number} ${property.street_name} ${property.suburb} ${property.state} ${property.postcode}`.toLowerCase();
        const owner = property.agency ? property.agency.name : (property.private_owners.length > 0 ? `${property.private_owners[0].first_name} ${property.private_owners[0].last_name}` : '').toLowerCase();
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
          aValue = `${a.street_number} ${a.street_name} ${a.suburb}`.toLowerCase();
          bValue = `${b.street_number} ${b.street_name} ${b.suburb}`.toLowerCase();
          break;
        case 'owner':
          const aOwner = a.agency ? a.agency.name : (a.private_owners.length > 0 ? `${a.private_owners[0].first_name} ${a.private_owners[0].last_name}` : 'No owner');
          const bOwner = b.agency ? b.agency.name : (b.private_owners.length > 0 ? `${b.private_owners[0].first_name} ${b.private_owners[0].last_name}` : 'No owner');
          aValue = aOwner.toLowerCase();
          bValue = bOwner.toLowerCase();
          break;
        case 'tenants':
          aValue = a.tenants.length;
          bValue = b.tenants.length;
          break;
        default:
          return 0;
      }

      if (aValue === bValue) return 0;
      
      const comparison = aValue > bValue ? 1 : -1;
      return localSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [properties, searchTerm, localSortField, localSortDirection]);

  const sortedProperties = getFilteredAndSortedProperties() || [];

  // Update total count and pages when filtered data changes
  useEffect(() => {
    setTotalCount(sortedProperties.length);
    setTotalPages(Math.ceil(sortedProperties.length / parseInt(entriesPerPage)));
  }, [sortedProperties, entriesPerPage]);

  // Get paginated data
  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const endIndex = startIndex + parseInt(entriesPerPage);
  const paginatedData = sortedProperties.slice(startIndex, endIndex);

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

  // Keep the UI-specific render functions in the component
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

  return (
    <DataTable
      data={paginatedData}
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
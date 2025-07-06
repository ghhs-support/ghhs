import { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import DataTable, { SortField } from "../common/DataTable";
import { useAuthenticatedApi } from "../../hooks/useAuthenticatedApi";

interface Property {
  id: number;
  unit_number: string | null;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  postcode: string;
  tenants: Tenant[];
  agency?: Agency;
  private_owners: PrivateOwner[];
}

interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

interface Agency {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface PrivateOwner {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

const PropertiesTable: React.FC = () => {
  const navigate = useNavigate();
  // Local state for client-side sorting
  const [localSortField, setLocalSortField] = useState<string | null>('street_name');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('asc');

  // State for data management
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

  // Define table columns
  const sortFields: SortField[] = [
    {
      key: 'address',
      label: 'Address',
      width: 'w-64',
      align: 'left'
    },
    {
      key: 'owner',
      label: 'Property Owner',
      width: 'w-48',
      align: 'left'
    },
    {
      key: 'tenants',
      label: 'Tenants',
      width: 'w-40',
      align: 'center'
    }
  ];

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

  const formatAddress = (property: Property) => {
    const parts = [
      property.unit_number && `Unit ${property.unit_number}`,
      property.street_number,
      property.street_name,
      property.suburb,
      property.state,
      property.postcode
    ].filter(Boolean);
    
    return parts.join(' ');
  };

  const formatOwner = (property: Property) => {
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
      const owner = property.private_owners[0];
      return (
        <div className="flex flex-col">
          <Badge size="sm" color="warning">Private</Badge>
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
            {owner.first_name} {owner.last_name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {owner.email}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col">
        <Badge size="sm" color="error">No Owner</Badge>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Unassigned
        </span>
      </div>
    );
  };

  const formatTenants = (tenants: Tenant[]) => {
    if (tenants.length === 0) {
      return (
        <div className="flex flex-col items-center">
          <Badge size="sm" color="error">No Tenants</Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Vacant
          </span>
        </div>
      );
    }
    
    if (tenants.length === 1) {
      const tenant = tenants[0];
      return (
        <div className="flex flex-col items-center">
          <Badge size="sm" color="success">1 Tenant</Badge>
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
            {tenant.first_name} {tenant.last_name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {tenant.phone}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center">
        <Badge size="sm" color="success">{tenants.length} Tenants</Badge>
        <span className="text-sm font-medium text-gray-800 dark:text-white/90">
          {tenants[0].first_name} {tenants[0].last_name}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          +{tenants.length - 1} more
        </span>
      </div>
    );
  };

  // Render individual row
  const renderRow = useCallback((property: Property) => (
    <TableRow 
      key={property.id}
      className="hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700"
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      <TableCell className="w-64 px-5 py-4 text-left border-r border-gray-200 dark:border-gray-700">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
            {formatAddress(property)}
          </span>
        </div>
      </TableCell>
      <TableCell className="w-48 px-5 py-4 text-left border-r border-gray-200 dark:border-gray-700">
        {formatOwner(property)}
      </TableCell>
      <TableCell className="w-40 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        {formatTenants(property.tenants)}
      </TableCell>
    </TableRow>
  ), [navigate]);

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
      sortFields={sortFields}
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
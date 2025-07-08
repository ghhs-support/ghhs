# DataTable Template System

This is a reusable data table system that provides pagination, sorting, search, and filtering capabilities with both server-side and client-side operations.

## Components

### 1. DataTable Component (`DataTable.tsx`)
The base table component that handles all the UI logic for:
- Table rendering with customizable columns
- Pagination controls
- Search functionality
- Sorting with visual indicators
- Loading and empty states
- Responsive design
- **Server-side vs Client-side operation modes**

### 2. useDataTable Hook (`useDataTable.ts`)
A custom hook that manages all the data fetching and state management:
- API calls with pagination
- Search functionality
- Sorting
- Error handling
- Loading states
- Filter parameter management

## Filtering & Sorting Modes

### Server-Side Operations (Default)
- All operations (search, sort, filter) are handled by the backend
- Only the current page of data is loaded
- Best for large datasets
- Consistent across all pages

### Client-Side Operations
- Operations are performed on the currently loaded data
- Faster response for small datasets
- Custom sorting logic for complex fields
- Used when `serverSideOperations={true}` is passed to DataTable

## How to Use

### Basic Server-Side Table
```typescript
import { useCallback } from 'react';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import DataTable, { SortField } from "../common/DataTable";
import { useDataTable } from "../../hooks/useDataTable";

export default function YourDataTable() {
  const {
    data,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    entriesPerPage,
    searchTerm,
    sortField,
    sortDirection,
    handleSearchChange,
    handlePageChange,
    handleEntriesPerPageChange,
    handleSort,
  } = useDataTable<YourDataType>({
    endpoint: '/your-api-endpoint',
    defaultSortField: 'created_at',
    defaultSortDirection: 'desc',
    defaultEntriesPerPage: '10'
  });

  // Define your table columns
  const sortFields: SortField[] = [
    {
      key: 'name',
      label: 'Name',
      width: 'w-64',
      align: 'left'
    },
    {
      key: 'status',
      label: 'Status',
      width: 'w-32',
      align: 'center'
    },
    {
      key: 'created_at',
      label: 'Created At',
      width: 'w-32',
      align: 'right'
    }
  ];

  const renderRow = useCallback((item: YourDataType) => (
    <TableRow key={item.id}>
      {/* Your row content */}
    </TableRow>
  ), []);

  return (
    <DataTable
      data={data}
      loading={loading}
      error={error}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      entriesPerPage={entriesPerPage}
      onPageChange={handlePageChange}
      onEntriesPerPageChange={handleEntriesPerPageChange}
      onSearchChange={handleSearchChange}
      onSort={handleSort}
      sortFields={sortFields}
      sortField={sortField}
      sortDirection={sortDirection}
      searchTerm={searchTerm}
      searchPlaceholder="Search..."
      renderRow={renderRow}
    />
  );
}
```

### Client-Side Table with Custom Filtering
```typescript
import { useCallback, useMemo, useState } from 'react';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import DataTable, { SortField } from "../common/DataTable";
import { useDataTable } from "../../hooks/useDataTable";

export default function ClientSideTable() {
  // Local state for client-side sorting
  const [localSortField, setLocalSortField] = useState<string | null>('created_at');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filters (can be from props or state)
  const filters = useMemo(() => ({
    status: statusFilter,
    category: categoryFilter,
    // ... other filters
  }), [statusFilter, categoryFilter]);

  const {
    data,
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
  } = useDataTable<YourDataType>({
    endpoint: '/your-api-endpoint',
    defaultEntriesPerPage: '10',
    filters // Pass filters to the hook
  });

  // Handle local sorting
  const handleLocalSort = useCallback((field: string) => {
    if (localSortField === field) {
      setLocalSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setLocalSortField(field);
      setLocalSortDirection('asc');
    }
  }, [localSortField]);

  // Custom sorting function for complex fields
  const getSortedData = useCallback(() => {
    if (!localSortField) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (localSortField) {
        case 'complex_field':
          // Custom sorting logic for complex fields
          aValue = a.nested?.property?.toLowerCase() || '';
          bValue = b.nested?.property?.toLowerCase() || '';
          break;
        case 'status':
          // Priority-based sorting
          const statusOrder = { 'active': 0, 'pending': 1, 'inactive': 2 };
          aValue = statusOrder[a.status?.toLowerCase()] ?? 999;
          bValue = statusOrder[b.status?.toLowerCase()] ?? 999;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = a[localSortField] || '';
          bValue = b[localSortField] || '';
      }

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return localSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, localSortField, localSortDirection]);

  const sortedData = getSortedData();

  const sortFields: SortField[] = [
    { key: 'name', label: 'Name', width: 'w-64', align: 'left' },
    { key: 'complex_field', label: 'Complex Field', width: 'w-48', align: 'center' },
    { key: 'status', label: 'Status', width: 'w-32', align: 'center' },
    { key: 'created_at', label: 'Created At', width: 'w-32', align: 'right' }
  ];

  const renderRow = useCallback((item: YourDataType) => (
    <TableRow key={item.id}>
      {/* Your row content */}
    </TableRow>
  ), []);

  return (
    <DataTable
      data={sortedData} // Use sorted data
      loading={loading}
      error={error}
      totalCount={totalCount}
      totalPages={totalPages}
      currentPage={currentPage}
      entriesPerPage={entriesPerPage}
      onPageChange={handlePageChange}
      onEntriesPerPageChange={handleEntriesPerPageChange}
      onSearchChange={handleSearchChange}
      onSort={handleLocalSort} // Use local sort handler
      sortFields={sortFields}
      sortField={localSortField} // Use local sort state
      sortDirection={localSortDirection} // Use local sort direction
      searchTerm={searchTerm}
      searchPlaceholder="Search..."
      renderRow={renderRow}
      serverSideOperations={true} // Enable client-side mode
    />
  );
}
```

## Real-World Examples

### 1. BeepingAlarmsTable (`BeepingAlarmsTable.tsx`)
- **Client-side sorting** with complex field logic
- **Server-side filtering** with multiple filter parameters
- **Custom date range filtering** with GMT+10 timezone handling
- **Complex field sorting** (allocation, tenant, agency/private)

Key features:
```typescript
// Complex date filtering
const createGMT10DateRangeForBackend = (dateString: string, isEndDate: boolean) => {
  // Custom timezone handling logic
};

// Complex sorting logic
case 'tenant':
  if (!a.property?.tenants?.length && !b.property?.tenants?.length) {
    return 0;
  }
  // Custom tenant sorting logic
  break;

case 'agency_private':
  aValue = a.property?.is_agency ? 'A' : (a.property?.is_private ? 'B' : 'C');
  bValue = b.property?.is_agency ? 'A' : (b.property?.is_private ? 'B' : 'C');
  break;
```

### 2. PropertiesTable (`PropertiesTable.tsx`)
- **Client-side filtering and sorting**
- **Search integration** with address and owner filtering
- **Custom formatting functions** for complex data display

Key features:
```typescript
// Client-side filtering with search
const getFilteredAndSortedProperties = useCallback(() => {
  let filtered = properties;
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filtered = properties.filter(property => {
      const address = formatPropertyAddress(property).toLowerCase();
      const owner = formatOwnerDisplay(property).name.toLowerCase();
      return address.includes(searchLower) || owner.includes(searchLower);
    });
  }
  // Then sort the filtered results
  return filtered.sort((a, b) => {
    // Custom sorting logic
  });
}, [properties, searchTerm, localSortField, localSortDirection]);
```

## Configuration Options

### DataTable Props
- `data`: Array of data items
- `loading`: Boolean for loading state
- `error`: Error message string
- `totalCount`: Total number of items
- `totalPages`: Total number of pages
- `currentPage`: Current page number
- `entriesPerPage`: Number of entries per page
- `onPageChange`: Function to handle page changes
- `onEntriesPerPageChange`: Function to handle entries per page changes
- `onSearchChange`: Function to handle search changes
- `onSort`: Function to handle sorting
- `sortFields`: Array of column definitions
- `sortField`: Current sort field
- `sortDirection`: Current sort direction
- `searchTerm`: Current search term
- `searchPlaceholder`: Placeholder text for search input
- `renderRow`: Function to render each row
- `renderEmptyState`: Custom empty state component
- `renderLoadingState`: Custom loading state component
- `tableHeight`: Custom table height (default: "432px")
- `showEntriesSelector`: Show/hide entries selector (default: true)
- `showSearch`: Show/hide search (default: true)
- `showPagination`: Show/hide pagination (default: true)
- **`serverSideOperations`**: Enable client-side mode (default: false)

### useDataTable Options
- `endpoint`: API endpoint URL
- `searchFields`: Array of fields to search in (optional)
- `defaultSortField`: Default field to sort by
- `defaultSortDirection`: Default sort direction ('asc' | 'desc')
- `defaultEntriesPerPage`: Default number of entries per page
- **`filters`**: Object containing filter parameters to send to API

### SortField Interface
```typescript
interface SortField {
  key: string;           // Unique identifier for the column
  label: string;         // Display label
  sortable?: boolean;    // Whether column is sortable (default: true)
  width?: string;        // CSS width class (e.g., 'w-64')
  align?: 'left' | 'center' | 'right'; // Text alignment
}
```

## Filtering Patterns

### 1. Server-Side Filtering
```typescript
// In your component
const filters = useMemo(() => ({
  status: statusFilter,
  category: categoryFilter,
  date_from: dateFromFilter,
  date_to: dateToFilter,
}), [statusFilter, categoryFilter, dateFromFilter, dateToFilter]);

// Pass to useDataTable
const { data, ... } = useDataTable({
  endpoint: '/api/data',
  filters
});
```

### 2. Client-Side Filtering
```typescript
// Filter the data before sorting
const getFilteredData = useCallback(() => {
  return data.filter(item => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
}, [data, statusFilter, searchTerm]);
```

### 3. Complex Date Filtering
```typescript
// GMT+10 timezone handling example
const createGMT10DateRangeForBackend = (dateString: string, isEndDate: boolean) => {
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (isEndDate) {
    // End of day in GMT+10
    const utcDate = new Date(Date.UTC(year, month - 1, day, 13, 59, 59, 999));
    return utcDate.toISOString();
  } else {
    // Start of day in GMT+10
    const utcDate = new Date(Date.UTC(year, month - 1, day - 1, 14, 0, 0, 0));
    return utcDate.toISOString();
  }
};
```

## Sorting Patterns

### 1. Simple Field Sorting
```typescript
case 'name':
  aValue = a.name?.toLowerCase() || '';
  bValue = b.name?.toLowerCase() || '';
  break;
```

### 2. Date Sorting
```typescript
case 'created_at':
  aValue = new Date(a.created_at).getTime();
  bValue = new Date(b.created_at).getTime();
  break;
```

### 3. Priority-Based Sorting
```typescript
case 'status':
  const statusOrder = {
    'new': 0,
    'in_progress': 1,
    'completed': 2,
    'cancelled': 3
  };
  aValue = statusOrder[a.status?.toLowerCase()] ?? 999;
  bValue = statusOrder[b.status?.toLowerCase()] ?? 999;
  break;
```

### 4. Complex Object Sorting
```typescript
case 'tenant':
  // Handle empty arrays
  if (!a.property?.tenants?.length && !b.property?.tenants?.length) {
    return 0;
  }
  if (!a.property?.tenants?.length) return 1;
  if (!b.property?.tenants?.length) return -1;
  
  // Sort by first tenant's name
  const aFirstTenant = a.property.tenants[0];
  const bFirstTenant = b.property.tenants[0];
  aValue = `${aFirstTenant.first_name} ${aFirstTenant.last_name}`.toLowerCase();
  bValue = `${bFirstTenant.first_name} ${bFirstTenant.last_name}`.toLowerCase();
  break;
```

## Best Practices

### 1. When to Use Client-Side vs Server-Side
- **Client-Side**: Small datasets (<1000 items), complex sorting logic, real-time filtering
- **Server-Side**: Large datasets, consistent performance, database-optimized queries

### 2. Performance Optimization
- Use `useCallback` for render functions
- Use `useMemo` for expensive calculations
- Implement proper dependency arrays
- Consider virtualization for very large lists

### 3. Error Handling
- Always handle loading states
- Provide meaningful error messages
- Implement retry mechanisms for failed requests

### 4. Accessibility
- Use proper ARIA labels
- Ensure keyboard navigation works
- Provide screen reader support

## Features

### ✅ Pagination
- Server-side pagination
- Configurable entries per page (10, 25, 50, 100, 200)
- Previous/Next navigation
- Entry count display

### ✅ Search
- Real-time search with debouncing
- Clear search functionality
- Customizable search placeholder
- Server-side search integration

### ✅ Sorting
- Click column headers to sort
- Visual sort indicators (arrows)
- Toggle between ascending/descending
- Both server-side and client-side sorting support
- Custom sorting logic for complex fields

### ✅ Filtering
- Server-side filtering with query parameters
- Client-side filtering for loaded data
- Multiple filter types (text, date, select)
- Complex filter combinations

### ✅ Responsive Design
- Mobile-friendly layout
- Horizontal scrolling for wide tables
- Consistent styling across devices

### ✅ Loading States
- Spinner during data fetching
- Customizable loading component
- Error state handling

### ✅ Empty States
- Customizable empty state message
- Consistent styling

### ✅ Dark Mode Support
- Full dark mode compatibility
- Consistent theming

## Troubleshooting

### Common Issues

1. **Sorting not working on some columns**
   - Ensure `serverSideOperations={true}` is set when using client-side sorting
   - Check that your sorting logic handles null/undefined values
   - Verify the sort field key matches your data structure

2. **Filters not applying**
   - Check that filters are properly memoized with `useMemo`
   - Ensure filter parameters are correctly formatted for your API
   - Verify the dependency array includes all filter variables

3. **Performance issues**
   - Use client-side operations only for small datasets
   - Implement proper memoization for expensive operations
   - Consider server-side operations for large datasets

## Benefits

1. **Consistency**: All tables have the same look and feel
2. **Reusability**: Create new tables in minutes
3. **Maintainability**: Changes to the base template affect all tables
4. **Type Safety**: Full TypeScript support
5. **Performance**: Optimized with React hooks and callbacks
6. **Accessibility**: Built with accessibility in mind
7. **Flexibility**: Supports both server-side and client-side operations 
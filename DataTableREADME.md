# DataTable Template System

This is a reusable data table system that provides pagination, sorting, search, and filtering capabilities out of the box.

## Components

### 1. DataTable Component (`DataTable.tsx`)
The base table component that handles all the UI logic for:
- Table rendering with customizable columns
- Pagination controls
- Search functionality
- Sorting with visual indicators
- Loading and empty states
- Responsive design

### 2. useDataTable Hook (`useDataTable.ts`)
A custom hook that manages all the data fetching and state management:
- API calls with pagination
- Search functionality
- Sorting
- Error handling
- Loading states

## How to Use

### Step 1: Define Your Data Type
```typescript
interface YourDataType {
  id: number;
  name: string;
  status: string;
  created_at: string;
  // ... other fields
}
```

### Step 2: Create Your Table Component
```typescript
import { useCallback } from 'react';
import { TableCell, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import DataTable, { SortField } from "../common/DataTable";
import { useDataTable } from "../../hooks/useDataTable";

export default function YourDataTable() {
  // Use the hook to manage data and state
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

  // Define your formatting functions
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge size="sm" color="success">Active</Badge>;
      case 'inactive':
        return <Badge size="sm" color="error">Inactive</Badge>;
      default:
        return <Badge size="sm" color="error">{status || 'Unknown'}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  // Render individual row
  const renderRow = useCallback((item: YourDataType) => (
    <TableRow 
      key={item.id}
      className="hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700"
    >
      <TableCell className="w-64 px-5 py-4 text-left border-r border-gray-200 dark:border-gray-700">
        <span className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap font-medium">
          {item.name}
        </span>
      </TableCell>
      <TableCell className="w-32 px-5 py-4 text-center border-r border-gray-200 dark:border-gray-700">
        <div className="mx-auto whitespace-nowrap">
          {getStatusBadge(item.status)}
        </div>
      </TableCell>
      <TableCell className="w-32 px-5 py-4 text-right">
        <span className="text-theme-xs text-gray-800 dark:text-white/90 whitespace-nowrap">
          {formatDate(item.created_at)}
        </span>
      </TableCell>
    </TableRow>
  ), [getStatusBadge, formatDate]);

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
      searchPlaceholder="Search by name, status..."
      renderRow={renderRow}
      renderEmptyState={
        <div className="flex items-center justify-center h-[360px] text-gray-500 dark:text-gray-400">
          No data found
        </div>
      }
    />
  );
}
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

### useDataTable Options
- `endpoint`: API endpoint URL
- `searchFields`: Array of fields to search in (optional)
- `defaultSortField`: Default field to sort by
- `defaultSortDirection`: Default sort direction ('asc' | 'desc')
- `defaultEntriesPerPage`: Default number of entries per page

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
- Server-side sorting support

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

## Examples

See the following files for complete examples:
- `BeepingAlarmsTable.tsx` - Real implementation
- `DataTableExample.tsx` - Simple example

## Benefits

1. **Consistency**: All tables will have the same look and feel
2. **Reusability**: Create new tables in minutes
3. **Maintainability**: Changes to the base template affect all tables
4. **Type Safety**: Full TypeScript support
5. **Performance**: Optimized with React hooks and callbacks
6. **Accessibility**: Built with accessibility in mind 
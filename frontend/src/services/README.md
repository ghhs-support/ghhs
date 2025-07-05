# Global Search Service

This service provides reusable search functions for different entities across the application. It centralizes all search logic and eliminates code duplication.

## Features

- **Centralized Search Logic**: All search functions are in one place
- **Type Safety**: Full TypeScript support with proper interfaces
- **Reusable**: Can be used in any component that needs searchable dropdowns
- **Consistent API**: All search functions follow the same pattern
- **Error Handling**: Built-in error handling and logging

## Available Search Functions

### `searchProperties(query: string)`
Searches for properties by address.
- **Endpoint**: `/maintenance/property-suggestions/`
- **Query Parameter**: `q`
- **Returns**: Array of `SearchOption` with property addresses

### `searchTenants(query: string)`
Searches for tenants by name or mobile number.
- **Endpoint**: `/maintenance/tenant-suggestions/`
- **Query Parameter**: `q`
- **Returns**: Array of `SearchOption` with tenant information

### `searchUsers(query: string)`
Searches for users by name.
- **Endpoint**: `/common/users/`
- **Query Parameter**: `q`
- **Returns**: Array of `SearchOption` with user names

## Usage

### Basic Usage

```tsx
import { useSearchService } from '../services/search';
import SearchableDropdown from '../common/SearchableDropdown';

const MyComponent = () => {
  const searchService = useSearchService();
  
  return (
    <SearchableDropdown
      onSearch={searchService.searchProperties}
      placeholder="Search properties..."
      onChange={(option) => console.log('Selected:', option)}
    />
  );
};
```

### In Forms

```tsx
import { useSearchService } from '../services/search';

const MyForm = () => {
  const searchService = useSearchService();
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  return (
    <form>
      <SearchableDropdown
        value={selectedProperty}
        onChange={setSelectedProperty}
        onSearch={searchService.searchProperties}
        placeholder="Select a property..."
        showApplyButton={false}
        showClearButton={true}
      />
    </form>
  );
};
```

### In Filter Cards

```tsx
import { useSearchService } from '../services/search';

const MyFilters = () => {
  const searchService = useSearchService();
  
  const filterConfigs = [
    {
      id: 'property',
      type: 'searchable-dropdown',
      label: 'Property',
      placeholder: 'Search by address...',
      onSearch: searchService.searchProperties
    },
    {
      id: 'tenant',
      type: 'searchable-dropdown',
      label: 'Tenant',
      placeholder: 'Search by name...',
      onSearch: searchService.searchTenants
    }
  ];
  
  return <FiltersCard filters={filterConfigs} />;
};
```

## Adding New Search Functions

To add a new search function:

1. **Add the function to the `SearchService` interface**:
```tsx
export interface SearchService {
  // ... existing functions
  searchNewEntity: (query: string) => Promise<SearchOption[]>;
}
```

2. **Implement the function in `createSearchService`**:
```tsx
export const createSearchService = (authenticatedGet: any): SearchService => {
  return {
    // ... existing functions
    searchNewEntity: async (query: string): Promise<SearchOption[]> => {
      try {
        const response = await authenticatedGet('/api/new-entity-suggestions/', {
          params: { q: query }
        });
        return response || [];
      } catch (error) {
        console.error('Error fetching new entity suggestions:', error);
        return [];
      }
    }
  };
};
```

3. **Use it in your components**:
```tsx
const searchService = useSearchService();
<SearchableDropdown onSearch={searchService.searchNewEntity} />
```

## Benefits

- **DRY Principle**: No more duplicate search logic
- **Maintainability**: Changes to search logic only need to be made in one place
- **Consistency**: All searchable dropdowns behave the same way
- **Testing**: Easier to test search functionality in isolation
- **Performance**: Centralized caching and optimization opportunities

## Example Component

See `SearchableDropdownExample.tsx` for a complete example of how to use all available search functions. 
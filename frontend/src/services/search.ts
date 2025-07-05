import { useAuthenticatedApi } from '../hooks/useAuthenticatedApi';

export interface SearchOption {
  value: string;
  label: string;
}

export interface SearchService {
  searchProperties: (query: string) => Promise<SearchOption[]>;
  searchTenants: (query: string) => Promise<SearchOption[]>;
  searchUsers: (query: string) => Promise<SearchOption[]>;
}

/**
 * Global Search Service
 * 
 * This service provides reusable search functions for different entities.
 * It centralizes all search logic and can be used across any component
 * that needs searchable dropdowns.
 * 
 * Usage:
 * ```tsx
 * import { useSearchService } from '../services/search';
 * 
 * const MyComponent = () => {
 *   const searchService = useSearchService();
 *   
 *   return (
 *     <SearchableDropdown
 *       onSearch={searchService.searchProperties}
 *       placeholder="Search properties..."
 *     />
 *   );
 * };
 * ```
 */

// Create a search service using the authenticated API
export const createSearchService = (authenticatedGet: any): SearchService => {
  return {
    searchProperties: async (query: string): Promise<SearchOption[]> => {
      console.log('Searching for property with query:', query);
      try {
        const response = await authenticatedGet('/maintenance/property-suggestions/', {
          params: { q: query }
        });
        console.log('Property search response:', response);
        return response || [];
      } catch (error) {
        console.error('Error fetching property suggestions:', error);
        return [];
      }
    },

    searchTenants: async (query: string): Promise<SearchOption[]> => {
      console.log('Searching for tenant with query:', query);
      try {
        const response = await authenticatedGet('/maintenance/tenant-suggestions/', {
          params: { q: query }
        });
        console.log('Tenant search response:', response);
        return response || [];
      } catch (error) {
        console.error('Error fetching tenant suggestions:', error);
        return [];
      }
    },

    searchUsers: async (query: string): Promise<SearchOption[]> => {
      console.log('Searching for users with query:', query);
      try {
        const response = await authenticatedGet('/common/users/', {
          params: { q: query }
        });
        console.log('Users search response:', response);
        
        // Transform user data to SearchOption format
        if (Array.isArray(response)) {
          return response.map((user: any) => ({
            value: user.id.toString(),
            label: `${user.first_name} ${user.last_name}`.trim() || user.username
          }));
        }
        
        return [];
      } catch (error) {
        console.error('Error fetching user suggestions:', error);
        return [];
      }
    }
  };
};

// Hook to use the search service
export const useSearchService = () => {
  const { authenticatedGet } = useAuthenticatedApi();
  return createSearchService(authenticatedGet);
}; 
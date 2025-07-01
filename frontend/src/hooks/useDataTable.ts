import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedApi } from './useAuthenticatedApi';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages: number;
  current_page: number;
}

export interface UseDataTableOptions<T> {
  endpoint: string;
  searchFields?: string[];
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
  defaultEntriesPerPage?: string;
}

export function useDataTable<T>({
  endpoint,
  searchFields = [],
  defaultSortField,
  defaultSortDirection = 'desc',
  defaultEntriesPerPage = '10'
}: UseDataTableOptions<T>) {
  const { authenticatedGet } = useAuthenticatedApi();
  
  // State
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(defaultEntriesPerPage);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<string | null>(defaultSortField || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: entriesPerPage,
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (sortField) {
        params.append('ordering', sortDirection === 'desc' ? `-${sortField}` : sortField);
      }
      
      const response = await authenticatedGet(`${endpoint}?${params.toString()}`);
      const paginatedResponse = response as PaginatedResponse<T>;
      
      setData(paginatedResponse.results);
      setTotalCount(paginatedResponse.count);
      setTotalPages(paginatedResponse.total_pages);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [authenticatedGet, endpoint, currentPage, entriesPerPage, searchTerm, sortField, sortDirection]);

  // Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
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

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    // Data
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
    
    // Handlers
    handleSearchChange,
    handlePageChange,
    handleEntriesPerPageChange,
    handleSort,
    refresh,
    
    // Utility
    fetchData,
  };
} 
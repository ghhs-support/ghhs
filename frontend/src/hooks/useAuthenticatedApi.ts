import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useCallback } from 'react';

interface ApiOptions {
  params?: Record<string, string>;
}

export const useAuthenticatedApi = () => {
  const { getToken, isAuthenticated } = useKindeAuth();

  const authenticatedGet = useCallback(async (url: string, options?: ApiOptions) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Build URL with query parameters
    let requestUrl = `http://localhost:8000/api${url}`;
    if (options?.params) {
      const searchParams = new URLSearchParams(options.params);
      requestUrl += `?${searchParams.toString()}`;
    }
    
    console.log('Making API request to:', requestUrl); // Debug log
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [isAuthenticated, getToken]);

  return { authenticatedGet };
}; 
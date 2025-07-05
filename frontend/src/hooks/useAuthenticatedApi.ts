import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useCallback } from 'react';

interface ApiOptions {
  params?: Record<string, string>;
}

interface PostOptions {
  data?: any;
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
    
    console.log('Making GET request to:', requestUrl); // Debug log
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).data = errorData;
      throw error;
    }

    return response.json();
  }, [isAuthenticated, getToken]);

  const authenticatedPost = useCallback(async (url: string, options?: PostOptions) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const requestUrl = `http://localhost:8000/api${url}`;
    
    console.log('Making POST request to:', requestUrl); // Debug log
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: options?.data ? JSON.stringify(options.data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`HTTP error! status: ${response.status}`);
      (error as any).data = errorData;
      throw error;
    }

    return response.json();
  }, [isAuthenticated, getToken]);

  return { authenticatedGet, authenticatedPost };
}; 
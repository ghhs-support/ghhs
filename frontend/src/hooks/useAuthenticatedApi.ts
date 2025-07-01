import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useCallback } from 'react';

export const useAuthenticatedApi = () => {
  const { getToken, isAuthenticated } = useKindeAuth();

  const authenticatedGet = useCallback(async (url: string) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const requestUrl = `http://localhost:8000/api${url}`;
    
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
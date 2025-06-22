import api from './api';
import { setAuthToken } from './api';

/**
 * Check if user has admin access by validating token with backend
 */
export const validateAdminAccess = async (token: string): Promise<boolean> => {
  try {
    const response = await api.post('/api/admin-access/', { token });
    return response.data.success;
  } catch (error) {
    console.error('Admin access validation error:', error);
    return false;
  }
};

const baseURL = import.meta.env.PROD 
  ? 'https://ghhs.fly.dev'
  : 'http://localhost:8000';

export const handleAuthCallback = async (code: string) => {
  try {
    const response = await fetch(`${baseURL}/api/token-exchange/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    setAuthToken(data.access_token);
    return data;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
}; 
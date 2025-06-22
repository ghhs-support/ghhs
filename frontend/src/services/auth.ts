import api from './api';

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
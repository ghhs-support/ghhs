/**
 * Check if user has admin access by validating token with backend
 */
export const validateAdminAccess = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:8000/api/admin-access/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      credentials: 'include',
    });
    
    const data = await response.json();
    return response.ok && data.success;
  } catch (error) {
    console.error('Admin access validation error:', error);
    return false;
  }
}; 
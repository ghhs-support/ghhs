import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminAccess() {
  const { isAuthenticated, isLoading, getToken } = useKindeAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleAdminAccess = async () => {
      if (isLoading) return;

      if (!isAuthenticated) {
        navigate('/signin');
        return;
      }

      try {
        setIsRedirecting(true);
        const token = await getToken();
        
        if (!token) {
          throw new Error('No token available');
        }
        
        // Use secure API endpoint to validate token and get admin access
        const response = await fetch('http://localhost:8000/api/admin-access/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
          credentials: 'include', // Include cookies for session
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Token validated successfully, redirect to admin
          window.open('http://localhost:8000/admin/', '_blank');
        } else {
          throw new Error(data.error || 'Failed to validate token');
        }
        
      } catch (error) {
        console.error('Failed to access admin:', error);
        alert('Failed to access admin. Please try again.');
      } finally {
        setIsRedirecting(false);
      }
    };

    handleAdminAccess();
  }, [isAuthenticated, isLoading, getToken, navigate]);

  if (isLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500">
            {isLoading ? 'Loading...' : 'Validating access...'}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">You need to be authenticated to access admin.</div>
          <button
            onClick={() => navigate('/signin')}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-gray-500">Validating admin access...</div>
      </div>
    </div>
  );
} 
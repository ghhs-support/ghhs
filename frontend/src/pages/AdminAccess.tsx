import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminAccess() {
  const { isAuthenticated, isLoading, getToken, logout: kindeLogout } = useKindeAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await kindeLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
          credentials: 'include',
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Token validated successfully, open admin in new tab
          window.open('http://localhost:8000/admin/', '_blank');
          
          // Show success message
          setIsSuccess(true);
          
          // Redirect back to dashboard after a short delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          // If backend validation fails, user might have stale tokens
          console.error('Backend validation failed:', data.error);
          throw new Error(data.error || 'Failed to validate token');
        }
        
      } catch (error) {
        console.error('Failed to access admin:', error);
        
        // If we get here, the user might have stale Kinde tokens but no valid Django session
        // Just redirect to signin
        alert('Your session has expired. Please sign in again.');
        navigate('/signin');
      } finally {
        setIsRedirecting(false);
      }
    };

    handleAdminAccess();
  }, [isAuthenticated, isLoading, getToken, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-green-600 font-medium mb-2">Admin Access Granted!</div>
          <div className="text-gray-500 mb-4">Django admin panel has been opened in a new tab.</div>
          <div className="text-sm text-gray-400">Redirecting to dashboard...</div>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-500">Opening admin panel...</div>
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
        <div className="text-gray-500 mb-4">Validating admin access...</div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
} 
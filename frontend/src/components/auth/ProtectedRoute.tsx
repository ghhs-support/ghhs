import { Navigate, useLocation } from 'react-router';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useKindeAuth();
  const location = useLocation();

  // Add a small delay to ensure authentication state is properly loaded
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Double check authentication with token presence
  if (!isAuthenticated) {
    console.warn('User not authenticated, redirecting to signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
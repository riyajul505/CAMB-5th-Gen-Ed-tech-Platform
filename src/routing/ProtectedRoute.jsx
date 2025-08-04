import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Component
 * Handles authentication and role-based authorization for routes
 * @param {React.ReactNode} children - Child components to render if authorized
 * @param {string|string[]} allowedRoles - Single role or array of roles allowed to access this route
 * @param {string} redirectTo - Where to redirect unauthorized users (optional)
 */
function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based authorization
  const userRole = user.role;
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!rolesArray.includes(userRole)) {
    // Redirect based on user's actual role
    let authorizedRedirect;
    switch (userRole) {
      case 'student':
        authorizedRedirect = '/dashboard';
        break;
      case 'parent':
        authorizedRedirect = '/parent-dashboard';
        break;
      case 'teacher':
      case 'admin':
        authorizedRedirect = '/teacher-dashboard';
        break;
      default:
        authorizedRedirect = '/';
    }
    
    console.warn(`Access denied: User with role '${userRole}' attempted to access route requiring roles: ${rolesArray.join(', ')}`);
    return <Navigate to={authorizedRedirect} replace />;
  }

  // User is authenticated and authorized
  return children;
}

/**
 * Student-specific protected route with path selection requirement
 * Extends ProtectedRoute with additional student-specific checks
 */
export function ProtectedStudentRoute({ children }) {
  const { user, pathSelected, loading } = useAuth();
  
  // First check if user is a student and authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Must be a student to access this route
  if (!user || user.role !== 'student') {
    const redirectPath = user?.role === 'parent' ? '/parent-dashboard' : 
                        user?.role === 'teacher' ? '/teacher-dashboard' : '/login';
    return <Navigate to={redirectPath} replace />;
  }
  
  // Students must select a learning path first
  if (pathSelected === false) {
    return <Navigate to="/select-path" replace />;
  }
  
  // Wrap in ProtectedRoute for additional security
  return (
    <ProtectedRoute allowedRoles="student">
      {children}
    </ProtectedRoute>
  );
}

export default ProtectedRoute; 
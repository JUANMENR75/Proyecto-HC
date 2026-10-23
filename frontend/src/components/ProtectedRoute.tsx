import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }: { allowedRoles?: Array<'ADMIN' | 'ENCARGADO'> }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Verificar si el usuario está autenticado.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si el usuario tiene el rol requerido.
  const hasRequiredRole = allowedRoles.length === 0 || (user && allowedRoles.includes(user.role));

  if (!hasRequiredRole) {
    // Si el rol falla, ahora redirigimos a una página de prueba.
    console.log(`[DEBUG] Acceso denegado. Redirigiendo a /acceso-denegado. Rol del usuario: ${user?.role}, Roles requeridos: ${allowedRoles}`);
    return <Navigate to="/acceso-denegado" replace />;
  }

  // Si todo está en orden, renderiza la ruta hija correspondiente.
  return <Outlet />;
};

export default ProtectedRoute;
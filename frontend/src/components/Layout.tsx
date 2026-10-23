import { useState} from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-toastify';
import TamazunchaleImg from '/Coordinacion.jpg';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const handleLogout = async () => {
    try {
      toast.info('Cerrando sesión...', { autoClose: false, toastId: 'logout-process' });
      await logout();
      toast.dismiss('logout-process');
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/login');
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
      toast.dismiss('logout-process');
      toast.error('Error al cerrar sesión. Intentando de nuevo...');
      try {
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
        window.location.href = '/login';
      } catch (finalError) {
        console.error('Error fatal durante el cierre de sesión:', finalError);
        toast.error('No se pudo cerrar sesión. Por favor, recarga la página e intenta de nuevo.');
      }
    }
  };

  const navItems = [
    { to: '/', label: 'Inicio', roles: ['ADMIN', 'ENCARGADO'] },
    { to: '/personal', label: 'Gestión de Personal', roles: ['ADMIN'] },
    { to: '/entrega-manual-medicamentos', label: 'Entrega de Medicamentos', roles: ['ENCARGADO'] },
    { to: '/donaciones-medicamentos', label: 'Donaciones de Medicamentos', roles: ['ENCARGADO'] },
    { to: '/entregas-medicamentos', label: 'Lista de Entregas de Medicamentos', roles: ['ENCARGADO'] },
    { to: '/inventario', label: 'Inventario de Medicamentos', roles: ['ADMIN', 'ENCARGADO'] },
    { to: '/doctores', label: 'Doctores', roles: ['ADMIN'] },
    { to: '/reportes', label: 'Reportes', roles: ['ADMIN', 'ENCARGADO'] },
  ].filter(i => i.roles.includes(user?.role!));

  // Función para obtener el nombre corto del usuario
  const getShortName = (fullName: string | undefined) => {
    if (!fullName) return '';
    // Devuelve las primeras dos palabras del nombre
    return fullName.split(' ').slice(0, 2).join(' ');
  };

  return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside
            className={`
          fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}
        >
          <div className="flex flex-col items-center py-6 border-b border-gray-200 gap-4">
            <img src="/Hospital Civil.png" alt="SIGH" className="h-20 w-auto mb-2" />
            <img src={TamazunchaleImg} alt="Ayuntamiento" className="h-14 w-auto" />
          </div>


          <nav className="mt-6 px-2 space-y-1">
            {navItems.map(item => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                        `flex items-center rounded-l-full px-4 py-3 text-base font-medium transition-all group
                ${
                            isActive
                                ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-700 shadow'
                                : 'text-gray-700 hover:bg-blue-100 hover:text-blue-900 border-l-4 border-transparent'
                        }`
                    }
                >
                  {item.label}
                </NavLink>
            ))}
          </nav>

          {/* Usuario y logout en móvil y tablets */}
          <div className="lg:hidden mt-6 px-4 border-t pt-4">
            <div className="text-base font-semibold text-gray-800">{getShortName(user?.nombre)}</div>
            <div className="text-xs text-gray-500 mb-2">({user?.role})</div>
            <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white text-base px-4 py-2 rounded-lg font-semibold mt-1 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Overlay para móvil */}
        {sidebarOpen && (
            <div
                className="fixed inset-0 z-20 bg-black bg-opacity-25 md:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 md:ml-64 min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-md px-2 py-2 md:px-6 lg:px-8 flex flex-wrap items-center justify-between w-full gap-y-2 border-b border-gray-200 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <button
                  className="text-2xl text-blue-700 md:hidden mr-2 ml-4"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? '✕' : '☰'}
              </button>
              <img src="/SGM.png" alt="SGM Logo" className="h-16 w-auto" />
            </div>

            {/* Usuario y logout SOLO visible en pantallas grandes */}
            <div className="hidden lg:flex flex-wrap items-center space-x-4 max-w-full">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
                <span className="font-semibold text-gray-800">{getShortName(user?.nombre)}</span>
                <span className="text-xs text-gray-500 font-medium">({user?.role})</span>
              </div>
              <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white text-base font-semibold px-4 py-2 rounded-lg transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </header>

          {/* Contenido del Main */}
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white py-2 text-center text-xs text-gray-400 border-t border-gray-200 mt-auto">
            Sistema de Gestión de Medicamentos (SGM) &copy; {new Date().getFullYear()}
          </footer>
        </div>
      </div>
  );
};

export default Layout;
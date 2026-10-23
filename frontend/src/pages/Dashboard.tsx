import { useAuth } from '../auth/AuthContext';
import { FaClipboardList } from 'react-icons/fa';

const Dashboard = () => {
  console.log('Renderizado de componentes');
  const { user } = useAuth();
  console.log('Datos del usuario:', {
    exists: !!user, 
    id: user?.id, 
    email: user?.email, 
    role: user?.role, 
    nombre: user?.nombre 
  });
  
  return (
      <div className="bg-gradient-to-b from-blue-50 via-white to-blue-50 min-h-screen pb-12">
        <div className="max-w-6xl mx-auto pt-12 px-6">

          {/* Bienvenida */}
          <section className="mb-12">
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100 flex flex-col sm:flex-row items-center justify-between transform transition-all hover:shadow-xl">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  ¡Bienvenido, <span className="text-blue-600">{user?.nombre}</span>!
                </h1>
                <div className="text-gray-600 font-medium text-lg">
                  {user?.role === 'ADMIN' && (
                      <>Gestiona personal, inventario, doctores y reportes con facilidad.</>
                  )}
                  {user?.role === 'ENCARGADO' && (

                      <>Controla inventario y registra medicamentos de recetas al instante.</>
                  )}
                </div>
              </div>
              <div className="mt-6 sm:mt-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center shadow-lg transform transition-all hover:scale-105">
                  <span className="text-4xl font-bold text-white">{user?.nombre?.[0] || 'S'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Resumen específico por rol */}
          <section className="mb-12">
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-blue-100 transition-all hover:shadow-xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">
                  <FaClipboardList />
                </span>
                Resumen de Actividad
              </h2>

              {user?.role === 'ADMIN' && (
                <div className="text-gray-600 bg-gray-50 p-5 rounded-2xl">
                  <p className="mb-3 text-lg">Como administrador, puedes gestionar:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Personal encargado de la farmacia</span>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Inventario de medicamentos</span>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Reportes y estadísticas</span>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Gestionar doctores</span>
                    </li>
                  </ul>
                </div>
              )}

              {user?.role === 'ENCARGADO' && (
                <div className="text-gray-600 bg-gray-50 p-5 rounded-2xl">
                  <p className="mb-3 text-lg">Como encargado de farmacia, tienes que:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Gestionar el inventario de medicamentos</span>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Procesar las entregas de medicamentos</span>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Controlar el stock y solicitar reposiciones</span>
                    </li>
                    <li className="flex items-center bg-white p-3 rounded-xl shadow-sm">
                      <span className="text-blue-500 mr-2">✓</span>
                      <span>Registrar la entrega de medicamentos</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
  );
};

export default Dashboard;

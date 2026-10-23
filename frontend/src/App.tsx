import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// Importa tus otras páginas aquí
import Personal from './pages/Personal';
import Inventario from './pages/Inventario';
import Doctores from './pages/Doctores';
import ReportesCombinados from './pages/ReportesCombinados';
import EntregaManualMedicamentos from './pages/EntregaManualMedicamentos';
import DonacionesMedicamentos from './pages/DonacionesMedicamentos';
import EntregasMedicamentos from './pages/EntregasMedicamentos';

const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
);

function App() {
  console.log('Renderizando componente');
  const { isLoading, isAuthenticated, user } = useAuth();

  console.log('Estado de autenticación:', { isLoading, isAuthenticated, userExists: !!user, userRole: user?.role });

  if (isLoading) {
    console.log('Autenticación cargando, mostrando spinner');
    return <LoadingSpinner />;
  }

  console.log('Autenticación cargada, renderizando rutas');

  return (
      <>
        <ToastContainer position="top-right" autoClose={3000} draggable={false} />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/personal" element={<Personal />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ENCARGADO', 'ADMIN']} />}>
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/entrega-manual-medicamentos" element={<EntregaManualMedicamentos />} />
              <Route path="/donaciones-medicamentos" element={<DonacionesMedicamentos />} />
              <Route path="/entregas-medicamentos" element={<EntregasMedicamentos />} />
              <Route path="/reportes" element={<ReportesCombinados />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/doctores" element={<Doctores />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </>
  );
}

export default App;
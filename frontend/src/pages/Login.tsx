import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useForm } from 'react-hook-form';

// Función auxiliar para registrar solo en el entorno de desarrollo
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

type LoginFormData = {
  email: string;
  password: string;
};

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  // Obtener la ruta de redirección desde el estado de ubicación o usar la ruta raíz por defecto
  const from = (location.state as any)?.from?.pathname || '/';

  // Redirigir a los usuarios autenticados fuera de la página de inicio de sesión
  useEffect(() => {
    devLog('Estado de autenticación cambiado:', isAuthenticated);
    if (isAuthenticated) {
      devLog('Usuario autenticado, redirigiendo a:', from);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      // No es necesario navegar aquí, el useEffect se encargará cuando cambie isAuthenticated
    } catch (err) {
      setError('Credenciales inválidas. Por favor, intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: 'url(/Backround_login.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200 space-y-6">
            <div>
              <h1 className="text-center text-2xl font-extrabold text-primary-600">
                Sistema de Gestión de Medicamentos (SGM)
              </h1>
              <h2 className="mt-3 text-center text-xl font-bold text-gray-900">
                Iniciar Sesión
              </h2>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="sr-only">Correo Electrónico</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`form-input rounded-md w-full ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="Correo Electrónico"
                    {...register('email', {
                      required: 'El correo electrónico es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Dirección de correo inválida'
                      }
                    })}
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Contraseña</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className={`form-input rounded-md w-full ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Contraseña"
                    {...register('password', {
                      required: 'La contraseña es requerida',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres'
                      }
                    })}
                />
                {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {error && (
                  <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
              )}

              <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`btn btn-primary w-full ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                      <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                  ) : (
                      'Iniciar Sesión'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
};

export default Login;

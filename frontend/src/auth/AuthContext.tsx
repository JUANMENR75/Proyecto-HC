import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Define los roles
type UserRole = "ADMIN" | "ENCARGADO";

// Este es el objeto de usuario
type User = {
  id: number;
  uid: number;
  pid?: number;
  userId?: number;
  nombre: string;
  email: string;
  role: UserRole;
  puesto: string;
};

// No exponemos token ni updateLastActivity. Son detalles internos.
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// --- HELPERS DE STORAGE ---
const USER_KEY = 'user_data';

function saveUser(user: User) {
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('[Auth] Error al guardar usuario:', error);
  }
}

function clearUser() {
  try {
    sessionStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error('[Auth] Error al limpiar usuario:', error);
  }
}

// --- COMPONENTE PROVIDER ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const navigate = useNavigate();

  // --- LÓGICA DE AUTENTICACIÓN ---
  const logout = async () => {
    console.trace('[Auth] Función de cierre de sesión llamada');
    console.log('[Auth] Estado de autenticación actual antes del cierre de sesión:', {
      isAuthenticated,
      hasUser: !!user,
      hasAccessToken: document.cookie.includes('access_token'),
      hasRefreshToken: document.cookie.includes('refresh_token')
    });

    try {
      console.log('[Auth] Enviando solicitud de cierre de sesión al servidor...');
      const response = await axios.post('/api/auth/logout');
      console.log('[Auth] Respuesta del servidor al cierre de sesión:', response.status);
    } catch (error: any) {
      console.error('[Auth] Fallo en el cierre de sesión del servidor:', error.response?.status);
      console.error('[Auth] Detalles del error de cierre de sesión:', error.response?.data || error.message);
    } finally {
      console.log('[Auth] Limpiando datos de usuario y estado de autenticación');
      clearUser();
      setUser(null);
      setIsAuthenticated(false);

      // Limpiar cookies en el cliente como último recurso
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
      document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';

      console.log('[Auth] Cookies después del cierre de sesión:', document.cookie);
      console.log('[Auth] Redirigiendo a la página de inicio de sesión');
      navigate('/login', { replace: true });
    }
  };

  // Interceptor de Axios para manejar errores 401 y refresco de token
  useEffect(() => {
    axios.defaults.withCredentials = true;
    console.log('[Auth] Configurando interceptor de Axios para manejar errores 401');
    const responseInterceptor = axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          console.log('[Auth] Error de solicitud detectado:', {
            status: error.response?.status,
            url: originalRequest?.url,
            method: originalRequest?.method,
            retry: originalRequest?._retry ? 'yes' : 'no'
          });

          if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('[Auth] Error 401 No autorizado detectado. Detalles:', {
              url: originalRequest.url,
              method: originalRequest.method,
              headers: originalRequest.headers,
              hasAccessToken: document.cookie.includes('access_token'),
              hasRefreshToken: document.cookie.includes('refresh_token')
            });

            originalRequest._retry = true;
            // No intentar refrescar si la petición fallida ya era de login, logout o refresh.
            if (!originalRequest.url.includes('/login') && !originalRequest.url.includes('/token') && !originalRequest.url.includes('/logout')) {
              console.log('[Auth] Intentando refrescar el token para la solicitud:', originalRequest.url);
              try {
                console.log('[Auth] Token de acceso expirado. Intentando refrescar...');
                const refreshResponse = await axios.post('/api/auth/token');
                console.log('[Auth] Respuesta de refresco del token:', refreshResponse.status, refreshResponse.data);
                console.log('[Auth] Token refrescado con éxito. Reintentando solicitud original.');
                return axios(originalRequest);
              } catch (refreshError: any) {
                console.error('[Auth] Fallo en el refresco del token. Estado:', refreshError.response?.status);
                console.error('[Auth] Detalles del error de refresco:', refreshError.response?.data || refreshError.message);
                console.log('[Auth] Cookies después del refresco fallido:', document.cookie);
                console.log('[Auth] Cerrando sesión debido a fallo en el refresco');
                await logout();
              }
            } else {
              console.log('[Auth] No se intenta refrescar el token para el endpoint relacionado con autenticación:', originalRequest.url);
            }
          } else if (error.response?.status === 401) {
            console.log('[Auth] Error 401 repetido después del intento de reintento. No se reintentará de nuevo.');
          }
          return Promise.reject(error);
        }
    );
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Se ejecuta una sola vez para configurar el interceptor

  // Efecto de inicialización al cargar la aplicación
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] Inicializando autenticación: Consultando al backend...');

      // NO comprobamos la cookie aquí. Simplemente intentamos la llamada a la API.
      // Si la cookie existe, el navegador la enviará automáticamente.
      // Si no existe, la llamada a la API fallará con un error 401.
      try {
        const response = await axios.get<User>('/api/auth/profile');

        // Si llegamos aquí, la API respondió 200 OK, lo que significa que la cookie era válida.
        setUser(response.data);
        setIsAuthenticated(true);
        saveUser(response.data); // Opcional: guardar en sessionStorage para recargas más rápidas de UI
        console.log('[Auth] Sesión validada con éxito a través de la API. El usuario está autenticado.');

      } catch (error) {
        // Si llegamos aquí, la API falló (probablemente 401), lo que significa que no hay sesión válida.
        console.log('[Auth] No se encontró una sesión válida a través de la API. El usuario no está autenticado.');
        setUser(null);
        setIsAuthenticated(false);
        clearUser();

      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []); // El array vacío asegura que solo se ejecute una vez.

  // Función de Login
  const login = async (email: string, password: string) => {
    console.log('[Auth] Intento de inicio de sesión para el usuario:', email);
    try {
      console.log('[Auth] Enviando solicitud de inicio de sesión al servidor...');
      const response = await axios.post<User>('/api/auth/login', { email, password });
      console.log('[Auth] Inicio de sesión exitoso, estado:', response.status);
      const userData = response.data;
      console.log('[Auth] Usuario autenticado:', userData.email, 'Rol:', userData.role);
      saveUser(userData);
      setUser(userData);
      setIsAuthenticated(true);
      setLastActivity(Date.now());
    } catch (error: any) {
      console.error('[Auth] Fallo en el inicio de sesión:', error.response?.status);
      console.log('[Auth] Detalles del error:', error.response?.data || error.message);
      console.log('[Auth] Solicitud que causó el error:', {
        url: '/api/auth/login',
        method: 'POST',
        email: email,
        // No se registra la contraseña por razones de seguridad
      });
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      throw error;
    }
  };

  // Timer de inactividad
  useEffect(() => {
    if (!isAuthenticated) return;
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos
    const checkInactivity = () => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        toast.info('Sesión cerrada por inactividad.');
        logout();
      }
    };
    const intervalId = setInterval(checkInactivity, 60000); // Revisa cada minuto

    // Lógica para actualizar la última actividad
    const updateLastActivity = () => setLastActivity(Date.now());
    const activityEvents: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, updateLastActivity));

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach(event => window.removeEventListener(event, updateLastActivity));
    };
  }, [isAuthenticated, lastActivity]);


  // El valor del contexto
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }), [user, isAuthenticated, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


// Hook personalizado para consumir el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
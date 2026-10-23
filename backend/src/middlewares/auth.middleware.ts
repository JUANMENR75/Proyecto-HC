import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Función auxiliar para registrar solo en entorno de desarrollo
const devLog = (...args: any[]) => {
  // Siempre registrar por ahora para diagnosticar errores 401
  console.log('[Auth Middleware]', ...args);
};

// Definir tipos de roles como literales de cadena
type UserRole = "ADMIN" | "ENCARGADO";

// Extender el tipo Request de Express para incluir usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        pid: number; // id personal
        uid: number; // id de usuario
        role: UserRole;
      };
    }
  }
}

// Middleware para verificar el token JWT
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  devLog('Ruta de solicitud:', req.path);
  devLog('Método de solicitud:', req.method);
  devLog('Encabezados de solicitud:', JSON.stringify(req.headers, null, 2));
  
  // Intentar obtener el token de la cookie primero
  const cookieToken = req.cookies.access_token;
  
  // Alternativa al encabezado de Autorización para compatibilidad con versiones anteriores
  const headerToken = req.headers.authorization?.split(' ')[1];
  
  devLog('Token de cookie existe:', !!cookieToken);
  devLog('Encabezado de autorización existe:', !!req.headers.authorization);
  
  const token = cookieToken || headerToken;

  if (!token) {
    devLog('ERROR: No se proporcionó token en la solicitud');
    devLog('Todas las cookies:', req.cookies);
    return res.status(401).json({ message: 'No se proporcionó token' });
  }

  try {
    devLog('JWT_SECRET existe:', !!process.env.JWT_SECRET);
    // Asegurar que SECRET tenga el tipo correcto y proporcionar una alternativa
    const SECRET: jwt.Secret = process.env.JWT_SECRET || 'default_secret';

    devLog('Longitud del token:', token.length);
    devLog('Primeros 10 caracteres del token:', token.substring(0, 10) + '...');
    
    try {
      const decoded = jwt.verify(token, SECRET) as {
        pid: number; // id personal
        uid: number; // id de usuario
        role: UserRole;
      };

      devLog('Token verificado exitosamente, decodificado:', decoded);
      req.user = decoded;
      next();
    } catch (jwtError: any) {
      devLog('Verificación JWT fallida:', jwtError.name, jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        devLog('Token expirado en:', jwtError.expiredAt);
      }
      throw jwtError; // Relanzar para ser capturado por el catch externo
    }
  } catch (error: any) {
    devLog('Error de verificación del token:', error.message);
    devLog('Nombre del error:', error.name);
    devLog('Pila de errores:', error.stack);
    
    return res.status(401).json({ 
      message: 'Token inválido', 
      error: error.name,
      errorMessage: error.message
    });
  }
};

// Middleware para verificar si el usuario tiene rol de administrador
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: '¡Se requiere rol de Administrador!' });
  }
  next();
};

// Middleware para verificar si el usuario tiene rol de encargado
export const isEncargado = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ENCARGADO" && req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: '¡Se requiere rol de Encargado!' });
  }
  next();
};


// Middleware para verificar si el usuario tiene rol de encargado o administrador
export const isEncargadoOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "ENCARGADO" && req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: '¡Se requiere rol de Encargado o Administrador!' });
  }
  next();
};

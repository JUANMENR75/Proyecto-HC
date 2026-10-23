import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { randomBytes } from 'crypto';

// Función auxiliar para registrar logs solo en entorno de desarrollo
const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Función auxiliar para generar token de acceso
const generateAccessToken = (payload: any): string => {
  const SECRET: Secret = process.env.JWT_SECRET || 'default_secret';
  
  // Usar el valor expiresIn directamente en el objeto de opciones
  const signOptions: SignOptions = {
    expiresIn: Number(process.env.JWT_ACCESS_EXPIRES_IN) || (15 * 60)
  };
  
  return jwt.sign(payload, SECRET, signOptions);
};

// Función auxiliar para generar token de actualización
const generateRefreshToken = async (userId: number): Promise<string> => {
  // Generar un token aleatorio
  const token = randomBytes(40).toString('hex');
  
  // Calcular fecha de expiración (7 días desde ahora)
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const expiresInMs = ms(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInMs);
  
  // Almacenar el token de actualización en la base de datos
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      isValid: true
    }
  });
  
  return token;
};

// Función auxiliar para convertir cadena de tiempo a milisegundos
function ms(timeStr: string): number {
  const regex = /^(\d+)(ms|s|m|h|d|w|y)$/;
  const match = timeStr.match(regex);
  
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const msValues: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000
  };
  
  return value * msValues[unit];
}

export const login = async (req: Request, res: Response) => {
  try {
    devLog('Intento de inicio de sesión iniciado');
    const { email, password } = req.body;
    devLog(`Intento de inicio de sesión para el correo: ${email}`);

    // Validar solicitud
    if (!email || !password) {
      devLog('Inicio de sesión fallido: Falta correo o contraseña');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Buscar usuario por email
    devLog(`Buscando usuario con correo: ${email}`);
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        personal: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user) {
      devLog(`Inicio de sesión fallido: No se encontró usuario con correo: ${email}`);
      // Devolver 401 en lugar de 404 para evitar filtrar información sobre qué usuarios existen
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    devLog(`Usuario encontrado: ${user.id} (${user.nombre})`);

    // Verificar contraseña
    devLog('Verificando contraseña');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      devLog(`Inicio de sesión fallido: Contraseña inválida para el usuario: ${user.id}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    devLog('Contraseña verificada con éxito');

    // Comprobar si el usuario tiene un registro personal, si no, crear uno
    let personalId = user.personal?.id;
    devLog(`ID personal inicial desde user.personal?.id: ${personalId}`);
    devLog(`Objeto personal del usuario en inicio de sesión:`, user.personal);

    if (!personalId) {
      devLog(`No se encontró registro personal para el usuario ${user.id}, creando uno`);
      try {
        const newPersonal = await prisma.personal.create({
          data: {
            nombre: user.nombre,
            puesto: 'No especificado', // Default value
            userId: user.id
          }
        });
        personalId = newPersonal.id;
        devLog(`Registro personal creado con ID: ${personalId}`);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error al crear registro personal:', error);
        }
        // Continuar con el inicio de sesión incluso si falla la creación del registro personal
      }
    }

    // Generar tokens
    devLog('Generando tokens');
    
    try {
      // Usar el id de la tabla Personal como identificador de usuario en el token
      const tokenPayload = {
        pid: personalId,   // personal id
        uid: user.id,      // user id
        role: user.role
      };
      devLog('Carga del token:', tokenPayload);

      // Generar token de acceso
      const accessToken = generateAccessToken(tokenPayload);
      devLog('Token de acceso generado con éxito');
      
      // Generar token de actualización
      const refreshToken = await generateRefreshToken(user.id);
      devLog('Token de actualización generado y almacenado con éxito');

      // Devolver información del usuario y token
      devLog('Inicio de sesión exitoso, devolviendo datos de usuario y token');

      // Usar el id de la tabla Personal como identificador de usuario
      devLog('Usando ID de tabla Personal como identificador:', personalId);

      // Obtener el valor de puesto del registro personal si existe
      let puesto = 'No especificado';
      if (personalId) {
        try {
          const personalRecord = await prisma.personal.findUnique({
            where: { id: personalId },
            select: { puesto: true }
          });
          if (personalRecord && personalRecord.puesto) {
            puesto = personalRecord.puesto;
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error al obtener puesto del registro personal:', error);
          }
          // Continuar con el valor predeterminado de puesto
        }
      }

      // Establecer cookies para tokens con ruta explícita para coincidir con la función de cierre de sesión
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Solo usar secure en producción
        sameSite: 'lax',
        path: '/', // Establecer ruta explícitamente para coincidir con la función de cierre de sesión
        maxAge: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', // Establecer ruta explícitamente para coincidir con la función de cierre de sesión
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
      });

      // Devolver datos del usuario sin tokens
      return res.status(200).json({
        pid: personalId || 0, // id personal, usar 0 como valor de respaldo
        uid: user.id, // id de usuario
        id: user.id, // Añadir propiedad id para consistencia
        userId: user.id, // Incluir userId para compatibilidad con el frontend
        nombre: user.nombre,
        email: user.email,
        role: user.role,
        puesto: puesto,
        // Los tokens ahora se envían como cookies HttpOnly
      });
    } catch (tokenError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al generar el token JWT:', tokenError);
      }
      return res.status(500).json({ message: 'Error al generar el token de autenticación' });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Detalles del error de inicio de sesión:', error);
    }

    // Comprobar si es un error relacionado con la base de datos
    if (error instanceof Error && error.hasOwnProperty('code') && 
        (typeof (error as any).code === 'string' && (error as any).code.startsWith('P') || 
         error.name === 'PrismaClientKnownRequestError')) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error de base de datos durante el inicio de sesión:', (error as Error).message);
      }
      return res.status(500).json({ message: 'Error de base de datos durante la autenticación' });
    }

    // Para otros tipos de errores
    return res.status(500).json({ message: 'Error interno del servidor durante la autenticación' });
  }
};

export const createUserWithPersonal = async (
  userData: { 
    nombre: string; 
    email: string; 
    password: string; 
    role?: string;
  },
  personalData?: { 
    puesto?: string;
  }
) => {
  try {
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        nombre: userData.nombre,
        email: userData.email,
        passwordHash,
        role: userData.role || 'DOCTOR', // Rol predeterminado (usando uno de los roles definidos: ADMIN, ENCARGADO)
      },
    });

    // Crear el registro personal vinculado al usuario
    const personal = await prisma.personal.create({
      data: {
        nombre: userData.nombre,
        puesto: personalData?.puesto ?? 'No especificado', // Valor predeterminado usando el operador de coalescencia nula
        userId: user.id,
      },
    });

    return {
      user,
      personal,
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error al crear usuario con el registro personal:', error);
    }
    throw error;
  }
};

// Endpoint de cierre de sesión
export const logout = async (req: Request, res: Response) => {
  try {
    // Obtener token de actualización de cookie o cuerpo de solicitud para compatibilidad con versiones anteriores
    const cookieRefreshToken = req.cookies.refresh_token;
    const bodyRefreshToken = req.body.refreshToken;
    const refreshToken = cookieRefreshToken || bodyRefreshToken;
    
    // Si tenemos un token de actualización, invalidarlo
    if (refreshToken) {
      // Encontrar el token de actualización
      const token = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });
      
      if (token) {
        // Invalidar el token
        await prisma.refreshToken.update({
          where: { id: token.id },
          data: { isValid: false }
        });
      }
    }
    
    // Definir opciones de cookie que coincidan con las utilizadas al establecer cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    };
    
    // Siempre limpiar cookies con opciones coincidentes, incluso si no se encontró ningún token
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    
    return res.status(200).json({ message: 'Cierre de sesión exitoso' });
  } catch (error) {
    console.error('Error durante la cierre de sesión:', error);
    
    // Definir opciones de cookie que coincidan con las utilizadas al establecer cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    };
    
    // Aún así limpiar cookies con opciones coincidentes incluso si hubo un error
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    
    return res.status(500).json({ message: 'Error interno del servidor durante el cierre de sesión' });
  }
};

// Endpoint de actualización de token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Obtener token de actualización de cookie o cuerpo de solicitud para compatibilidad con versiones anteriores
    const cookieRefreshToken = req.cookies.refresh_token;
    const bodyRefreshToken = req.body.refreshToken;
    const refreshToken = cookieRefreshToken || bodyRefreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Se requiere un token de actualización' });
    }
    
    // Buscar el token de actualización en la base de datos
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { personal: true } } }
    });
    
    // Comprobar si el token existe y es válido
    if (!storedToken || !storedToken.isValid) {
      // Limpiar cookies si el token no es válido
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.status(401).json({ message: 'Token de actualización no válido' });
    }
    
    // Comprobar si el token ha expirado
    if (new Date() > storedToken.expiresAt) {
      // Invalidar el token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isValid: false }
      });
      // Limpiar cookies si el token ha expirado
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return res.status(401).json({ message: 'El token de actualización ha expirado' });
    }
    
    const user = storedToken.user;
    const personalId = user.personal?.id;
    
    // Generar un nuevo token de acceso
    const tokenPayload = {
      pid: personalId,   // id personal
      uid: user.id,      // id de usuario
      role: user.role
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    
    // Establecer el nuevo token de acceso como cookie
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/', // Establecer ruta explícitamente para coincidir con la función de cierre de sesión
      maxAge: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
    });
    
    // Devolver mensaje de éxito sin tokens en el cuerpo
    return res.status(200).json({
      message: 'Token actualizado con éxito'
    });
  } catch (error) {
    console.error('Error al actualizar el token:', error);
    return res.status(500).json({ message: 'Error interno del servidor durante la actualización del token' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
// Verifica si req.user existe antes de intentar acceder a sus propiedades
    if (!req.user) {
      console.error('getProfile: req.user está indefinido - el middleware de autenticación puede haber fallado');
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

// Usa el uid de req.user (ID de la tabla de usuarios) en lugar de pid (ID de la tabla personal)
    const userId = req.user.uid;
    const userRole = req.user.role;

    if (!userId) {
      console.error('getProfile: userId no está definido o es nulo');
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

// Registra el ID de usuario que estamos tratando de encontrar
    devLog(`getProfile: Buscando usuario con ID: ${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nombre: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          personal: {
            select: {
              id: true,
              puesto: true
            }
          }
        },
      });

      if (!user) {
        console.error(`getProfile: Usuario con ID ${userId} no encontrado en la base de datos`);
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

     // Verifica si el usuario tiene un usuario personal, si no, crea uno.
      let personalId = user.personal?.id;
      let puesto = user.personal?.puesto ?? 'No especificado';

      devLog(`ID personal inicial desde user.personal?.id en getProfile: ${personalId}`);
      devLog(`Objeto personal del usuario en getProfile:`, user.personal);

      if (!personalId) {
        devLog(`No se encontró registro personal para el usuario ${user.id} en getProfile, creando uno`);
        try {
          const newPersonal = await prisma.personal.create({
            data: {
              nombre: user.nombre,
              puesto: 'No especificado', // Valor predeterminado
              userId: user.id
            }
          });
          personalId = newPersonal.id;
          puesto = newPersonal.puesto;
          devLog(`Registro personal creado con ID: ${personalId}`);
        } catch (personalError) {
          console.error('Error al crear el registro personal en getProfile:', personalError);
          // Si no podemos crear un registro personal, aún devolveremos los datos del usuario
          // pero con un personalId predeterminado para evitar errores
          personalId = 0; // Usa un ID predeterminado
        }
      }

      // Generar un nuevo token JWT para la actualización del token
      try {
        const SECRET: Secret = process.env.JWT_SECRET || 'default_secret';
        const signOptions: SignOptions = {
          expiresIn: 8 * 60 * 60  // 8 horas en segundos
        };

        const tokenPayload = {
          pid: personalId,   // personal id
          uid: user.id,      // user id
          role: user.role
        };

        devLog('Generando nuevo token JWT para respuesta de perfil');
        const token = jwt.sign(
          tokenPayload,
          SECRET,
          signOptions
        );
        devLog('Nuevo token JWT generado con éxito para respuesta de perfil');

        // Establecer el token como una cookie en lugar de incluirlo en el cuerpo de la respuesta
        res.cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/', // Establecer explícitamente la ruta para coincidir con la función de cierre de sesión
          maxAge: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
        });

        // Crear datos de respuesta sin desestructuración para evitar posibles errores de null
        const responseData = {
          pid: personalId, // personal id
          uid: user.id, // user id
          id: user.id, // Agregar propiedad de id para consistencia
          userId: user.id, // Incluir userId para compatibilidad con el frontend
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          puesto: puesto
          // El token ahora se envía como una cookie HttpOnly
        };

        devLog('Datos de respuesta del perfil:', responseData);
        devLog('Usando ID de tabla Personal como identificador en perfil:', personalId);

        return res.status(200).json(responseData);
      } catch (tokenError) {
        console.error('Error al generar el token JWT en getProfile:', tokenError);
        // Incluso si la generación de token falla, aún podemos devolver los datos del usuario sin un token.
        return res.status(200).json({
          pid: personalId,
          uid: user.id,
          id: user.id,
          userId: user.id,
          nombre: user.nombre,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          puesto: puesto,
          // No se incluyó el token
        });
      }
    } catch (dbError) {
      console.error('Error de base de datos en getProfile:', dbError);
      return res.status(500).json({ message: 'Error de base de datos al recuperar el perfil del usuario' });
    }
  } catch (error) {
    console.error('Error inesperado en getProfile:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

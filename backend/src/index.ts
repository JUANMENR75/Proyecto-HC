/**
 * @fileoverview Archivo principal del servidor backend para el Sistema de Gestión de Medicamentos (SGM).
 * Configura el servidor Express, middleware, rutas y manejo de errores.
 * Establece la conexión con la base de datos a través de Prisma ORM.
 */

/**
 * Carga las variables de entorno desde el archivo especificado en NODE_ENV_DB_PATH o .env por defecto
 * Esta configuración debe estar antes de cualquier importación que use Prisma
 */
require('dotenv').config({
  path: process.env.NODE_ENV_DB_PATH || '.env'
});

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger, createLogger } from './utils/logger.util';
import cookieParser from 'cookie-parser';

// Importar y establecer el túnel SSH condicionalmente
let prismaImportPromise = Promise.resolve();

// Solo intentar el túnel SSH si la variable de entorno está explícitamente en 'true'
if (process.env.USE_SSH_TUNNEL === 'true') {
  console.log('Modo Cloud detectado. Usando túnel SSH para conexión MySQL...');
  try {
    const sshTunnel = require('./ssh-tunnel');

    prismaImportPromise = sshTunnel.tunnelPromise
        .then(() => {
          console.log('Túnel SSH establecido con éxito, ahora inicializando el cliente Prisma.');
        })
        .catch((error: Error) => {
          console.error('No se pudo establecer el túnel SSH:', error);
          console.error('Las conexiones a la base de datos probablemente fallarán.');
        });

    process.on('SIGINT', () => {
      console.log('Cerrando túnel SSH...');
      if (sshTunnel && typeof sshTunnel.close === 'function') {
        sshTunnel.close();
      }
    });
  } catch (error) {
    console.error('Error al establecer el túnel SSH:', error);
  }
} else {
  console.log('Modo Local detectado. Saltando conexión con el túnel SSH.');
}


// Importar Prisma después de que se establezca el túnel SSH
import { PrismaClient } from '@prisma/client';
// Crea un marcador de posición para el cliente prisma que se inicializará más tarde.
export let prisma: PrismaClient;

prismaImportPromise.then(() => {
  const { prisma: prismaClient } = require('./lib/prisma');
  prisma = prismaClient;
});

/**
 * Importación de rutas para los diferentes módulos del sistema
 */
// Rutas
import authRoutes from './routes/auth.routes';
import personalRoutes from './routes/personal.routes';
import medicamentoRoutes from './routes/medicamento.routes';
import pacienteRoutes from './routes/paciente.routes';
import doctorRoutes from './routes/doctor.routes';
import entregaRoutes from './routes/entrega.routes';
import donacionRoutes from './routes/donacion.routes';

/**
 * Inicialización de la aplicación Express
 * @type {express.Application}
 */
const app = express();

/**
 * Configuración del host y puerto para el servidor
 */
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT ?? 3000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://localhost:5173';
console.log('Backend CORS configurado para el origen:', FRONTEND_ORIGIN);


/**
 * Configuración de middleware
 */
app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

/**
 * Middleware de registro (logger)
 */
const requestLogger = createLogger('HTTP');
app.use((req: Request, res: Response, next: NextFunction) => {
  requestLogger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * Ruta raíz
 */
app.get('/', (_req, res) => {
  res.json({ message: 'Sistema de Gestión de Medicamentos (SGM) API' });
});

/**
 * Configuración de rutas
 */
app.use('/api/auth', authRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/medicamentos', medicamentoRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/doctores', doctorRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/donaciones', donacionRoutes);

/**
 * Middleware para manejo de errores
 */
const errorLogger = createLogger('Error');
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  errorLogger.error('Error no manejado:', err.stack);
  res.status(500).json({
    message: 'Error Interno del Servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * Inicialización del servidor HTTP
 */
const serverLogger = createLogger('Server');
prismaImportPromise.then(() => {
  app.listen(PORT, HOST, () => {
    serverLogger.success(`Servidor ejecutándose en http://${HOST}:${PORT}`);
  });
}).catch((error: Error) => {
  serverLogger.error('Error al inicializar el cliente de Prisma:', error);
  app.listen(PORT, HOST, () => {
    serverLogger.success(`Servidor ejecutándose en http://${HOST}:${PORT} (sin conexión a base de datos)`);
  });
});

/**
 * Manejo de cierre del servidor
 */
const dbLogger = createLogger('Database');
process.on('SIGINT', async () => {
  if (prisma) {
    await prisma.$disconnect();
    dbLogger.info('Desconectado de la base de datos');
  }
  serverLogger.info('Servidor detenido');
  process.exit(0);
});

/**
 * Manejo de promesas rechazadas no capturadas
 */
const unhandledLogger = createLogger('Unhandled');
process.on('unhandledRejection', (reason, promise) => {
  unhandledLogger.error('Promesa rechazada no capturada:', reason);
  console.error('Detalles completos de la promesa rechazada:', promise);
});
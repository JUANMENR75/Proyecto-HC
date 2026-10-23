import { Router } from 'express';
import { 
  getAllEntregas, 
  getEntregaById, 
  createEntrega, 
  createManualEntrega,
  deleteEntrega,
  getEntregasByUser
} from '../controllers/entrega.controller';
import { verifyToken, isEncargado } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// GET /api/entregas - Obtener todas las entregas
// Permitir a todos los usuarios autenticados ver las entregas
router.get('/', getAllEntregas);

// GET /api/entregas/user - Obtener entregas del usuario
// Permitir a todos los usuarios autenticados ver sus propias entregas
router.get('/user', getEntregasByUser);

// GET /api/entregas/:id - Obtener entrega por ID
// Permitir a todos los usuarios autenticados ver las entregas
router.get('/:id', getEntregaById);

// POST /api/entregas - Crear nueva entrega
// Restringir la creación al rol ENCARGADO
router.post('/', isEncargado, createEntrega);

// POST /api/entregas/manual - Crear nueva entrega
// Restringir la creación al rol ENCARGADO
router.post('/manual', isEncargado, createManualEntrega);

// DELETE /api/entregas/:id - Eliminar entrega
// Restringir la eliminación al rol ENCARGADO
router.delete('/:id', isEncargado, deleteEntrega);

export default router;

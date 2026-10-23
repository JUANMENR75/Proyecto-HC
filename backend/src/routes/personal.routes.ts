import { Router } from 'express';
import { 
  getAllPersonal, 
  getPersonalById, 
  createPersonal, 
  updatePersonal, 
  deletePersonal,
  getPersonalByUserId,
  getMyPersonal,
  getPersonalStats
} from '../controllers/personal.controller';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware verifyToken a todas las rutas
router.use(verifyToken);

// Rutas que solo requieren autenticación (no se necesita rol de administrador)
router.get('/user/:userId', getPersonalByUserId);
router.get('/me', getMyPersonal);

// Crear un nuevo router para rutas exclusivas de administrador
const adminRouter = Router();

// Aplicar middleware de administrador a todas las rutas en adminRouter
adminRouter.use(isAdmin);

// GET /api/personal - Obtener todo el personal
adminRouter.get('/', getAllPersonal);

// GET /api/personal/stats - Obtener estadísticas del personal
adminRouter.get('/stats', getPersonalStats);

// GET /api/personal/:id - Obtener personal por ID
adminRouter.get('/:id', getPersonalById);

// POST /api/personal - Crear nuevo personal
adminRouter.post('/', createPersonal);

// PUT /api/personal/:id - Actualizar personal
adminRouter.put('/:id', updatePersonal);

// DELETE /api/personal/:id - Eliminar personal
adminRouter.delete('/:id', deletePersonal);

// Montar el router de administrador
router.use('/', adminRouter);

export default router;

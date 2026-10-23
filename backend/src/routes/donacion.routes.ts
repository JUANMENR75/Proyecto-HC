// backend/src/routes/donacion.routes.ts
import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { getAllDonaciones, createDonacion } from '../controllers/donacion.controller';

const router = Router();

// Protegemos todas las rutas de este archivo
router.use(verifyToken);

// RUTA GET
router.get('/', getAllDonaciones);

// Ruta POST
router.post('/', createDonacion);

export default router;
import { Router } from 'express';
import { 
  getAllDoctors, 
  getDoctorById, 
  createDoctor, 
  updateDoctor, 
  deleteDoctor 
} from '../controllers/doctor.controller';
import { verifyToken, isAdmin, isEncargado } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de doctores están protegidas
router.use(verifyToken);

// GET /api/doctores - Obtener todos los doctores (accesible para todos los usuarios autenticados)
router.get('/', getAllDoctors);

// GET /api/doctores/:id - Obtener doctor por ID (accesible para todos los usuarios autenticados)
router.get('/:id', getDoctorById);

// Las siguientes rutas requieren rol de ADMIN o ENCARGADO
// Aplicar middleware a rutas específicas
const adminOrEncargado = [isAdmin, isEncargado];

// POST /api/doctores - Crear nuevo doctor
router.post('/', adminOrEncargado, createDoctor);

// PUT /api/doctores/:id - Actualizar doctor
router.put('/:id', adminOrEncargado, updateDoctor);

// DELETE /api/doctores/:id - Eliminar doctor
router.delete('/:id', adminOrEncargado, deleteDoctor);

export default router;
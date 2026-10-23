import { Router } from 'express';
import { 
  getAllPacientes, 
  getPacienteById, 
  getPacienteByCurp,
  createPaciente, 
  updatePaciente, 
  deletePaciente 
} from '../controllers/paciente.controller';
import { verifyToken, isEncargado } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// GET /api/pacientes - Obtener todos los pacientes
router.get('/', getAllPacientes);

// GET /api/pacientes/curp/:curp - Obtener paciente por CURP
router.get('/curp/:curp', getPacienteByCurp);

// GET /api/pacientes/:id - Obtener paciente por ID
router.get('/:id', getPacienteById);

// POST /api/pacientes - Crear nuevo paciente
// Restringir operaciones de modificación al rol ENCARGADO
router.post('/', isEncargado, createPaciente);

// PUT /api/pacientes/:id - Actualizar paciente
// Restringir operaciones de modificación al rol ENCARGADO
router.put('/:id', isEncargado, updatePaciente);

// DELETE /api/pacientes/:id - Eliminar paciente
// Restringir operaciones de modificación al rol ENCARGADO
router.delete('/:id', isEncargado, deletePaciente);

export default router;

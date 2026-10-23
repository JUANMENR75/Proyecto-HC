import { Router } from 'express';
import { 
  getAllMedicamentos, 
  getMedicamentoById, 
  getMedicamentoByClave,
  createMedicamento, 
  updateMedicamento, 
  deleteMedicamento,
  updateInventory,
  getActivityLogs
} from '../controllers/medicamento.controller';
import { verifyToken, isEncargado, isEncargadoOrAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// GET /api/medicamentos/activity-logs - Obtener registros de actividad
router.get('/activity-logs', getActivityLogs);

// GET /api/medicamentos - Obtener todos los medicamentos
// Restringido a roles ENCARGADO y ADMIN
router.get('/', isEncargadoOrAdmin, getAllMedicamentos);

// GET /api/medicamentos/clave/:clave - Obtener medicamento por clave
// Restringido a roles ENCARGADO y ADMIN
router.get('/clave/:clave', isEncargadoOrAdmin, getMedicamentoByClave);

// GET /api/medicamentos/:id - Obtener medicamento por ID
// Restringido a roles ENCARGADO y ADMIN
router.get('/:id', isEncargadoOrAdmin, getMedicamentoById);

// POST /api/medicamentos - Crear nuevo medicamento
// Restringir operaciones de modificación al rol ENCARGADO
router.post('/', isEncargado, createMedicamento);

// PUT /api/medicamentos/:id - Actualizar medicamento
// Restringir operaciones de modificación al rol ENCARGADO
router.put('/:id', isEncargado, updateMedicamento);

// DELETE /api/medicamentos/:id - Eliminar medicamento
// Restringir operaciones de modificación al rol ENCARGADO
router.delete('/:id', isEncargado, deleteMedicamento);

// PATCH /api/medicamentos/:id/inventory - Actualizar cantidad de inventario
// Restringir operaciones de modificación al rol ENCARGADO
router.patch('/:id/inventory', isEncargado, updateInventory);

export default router;

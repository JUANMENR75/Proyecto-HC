import { Router } from 'express';
import { login, getProfile, refreshToken, logout } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/login - Iniciar sesión como usuario
router.post('/login', login);

// GET /api/auth/profile - Obtener perfil de usuario (ruta protegida)
router.get('/profile', verifyToken, getProfile);

// POST /api/auth/token - Actualizar el token de acceso utilizando el token de actualización
router.post('/token', refreshToken);

// POST /api/auth/logout - Cerrar sesión del usuario e invalidar el token de actualización
router.post('/logout', logout);

export default router;
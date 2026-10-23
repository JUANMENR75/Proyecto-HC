import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

// OBTENER /api/personal
export const getAllPersonal = async (_: Request, res: Response) => {
  try {
    const lista = await prisma.personal.findMany({
      include: {
        user: {
          select: { id: true, email: true, role: true }
        }
      },
      orderBy: { nombre: 'asc' },
    });
    return res.status(200).json(lista);
  } catch (error) {
    console.error('Error al listar personal:', error);
    return res.status(500).json({ message: 'Error al listar personal' });
  }
};

// CREAR /api/personal
export const createPersonal = async (req: Request, res: Response) => {
  const { nombre, puesto, email, password, role } = req.body;

  if (!nombre || !puesto || !email || !password || !role) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await tx.user.create({
        data: {
          nombre,
          email,
          passwordHash,
          role,
        },
      });
      const newPersonal = await tx.personal.create({
        data: {
          nombre,
          puesto,
          userId: newUser.id,
        },
      });
      return { ...newPersonal, user: { email: newUser.email, role: newUser.role } };
    });
    res.status(201).json(result);
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
    }
    console.error('Error al crear personal:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ELIMINAR /api/personal/:id
export const deletePersonal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const personalId = parseInt(id);

  try {
    await prisma.$transaction(async (tx) => {
      const personalRecord = await tx.personal.findUnique({
        where: { id: personalId },
        select: { userId: true }
      });

      if (!personalRecord) {
        throw new Error('Personal no encontrado.');
      }

      await tx.personal.delete({
        where: { id: personalId },
      });

      await tx.user.delete({
        where: { id: personalRecord.userId },
      });
    });
    res.status(200).json({ message: 'Personal eliminado correctamente.' });
  } catch (error: any) {
    console.error('Error al eliminar personal:', error);
    if (error.message === 'Personal no encontrado.') {
      return res.status(404).json({ message: 'Personal no encontrado.' });
    }
    if (error?.code === 'P2003') {
      return res.status(409).json({ message: 'No se puede eliminar: este personal tiene otros registros asociados.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

// ACTUALIZAR /api/personal/:id
export const updatePersonal = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, puesto, role, email, password } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el registro en la tabla Personal
      const updatedPersonal = await tx.personal.update({
        where: { id: parseInt(id) },
        data: { nombre, puesto },
        select: { userId: true },
      });

      // 2. Preparar los datos para actualizar la tabla User
      const userDataToUpdate: { nombre?: string; role?: string; email?: string; passwordHash?: string } = {};

      // ✅ CORRECCIÓN: Añadir el nombre a los datos que se actualizarán en la tabla User
      if (nombre) {
        userDataToUpdate.nombre = nombre;
      }
      if (role) {
        userDataToUpdate.role = role;
      }
      if (email) {
        userDataToUpdate.email = email;
      }
      if (password) {
        userDataToUpdate.passwordHash = await bcrypt.hash(password, 10);
      }

      // 3. Si hay datos para actualizar en User, ejecutar la actualización
      if (Object.keys(userDataToUpdate).length > 0) {
        await tx.user.update({
          where: { id: updatedPersonal.userId },
          data: userDataToUpdate,
        });
      }

      // 4. Devolver el registro completo para la respuesta
      return tx.personal.findUnique({
        where: { id: parseInt(id) },
        include: { user: { select: { email: true, role: true } } },
      });
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
      return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ message: 'Personal no encontrado.' });
    }
    console.error('Error al actualizar personal:', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};


// OBTENER /api/personal/:id
export const getPersonalById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { email: true, role: true }
        }
      }
    });
    if (!personal) {
      return res.status(404).json({ message: 'Personal no encontrado' });
    }
    return res.status(200).json(personal);
  } catch (error) {
    console.error('Error al obtener personal por ID:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// OBTENER /api/personal/user/:userId
export const getPersonalByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const personal = await prisma.personal.findUnique({
      where: { userId: parseInt(userId) },
    });
    if (!personal) {
      return res.status(404).json({ message: 'Registro de personal no encontrado para este usuario' });
    }
    return res.status(200).json(personal);
  } catch (error) {
    console.error('Error al obtener personal por User ID:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// OBTENER /api/personal/me - Datos del usuario logueado
export const getMyPersonal = async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'No autenticado o ID de usuario no encontrado en el token.' });
  }
  try {
    const personal = await prisma.personal.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: { email: true, role: true, nombre: true }
        }
      }
    });
    if (!personal) {
      return res.status(404).json({ message: 'No se encontró un perfil de personal para el usuario autenticado.' });
    }
    return res.status(200).json(personal);
  } catch (error) {
    console.error('Error al obtener mi perfil de personal:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// OBTENER /api/personal/stats
export const getPersonalStats = async (_: Request, res: Response) => {
  try {
    const total = await prisma.personal.count();
    const conteoPorPuesto = await prisma.personal.groupBy({
      by: ['puesto'],
      _count: {
        puesto: true,
      },
    });
    return res.status(200).json({
      totalPersonal: total,
      distribucionPorPuesto: conteoPorPuesto,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de personal:', error);
    return res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};
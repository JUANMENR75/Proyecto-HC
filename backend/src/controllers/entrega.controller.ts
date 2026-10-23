// src/controllers/entrega.controller.ts

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createLogger } from '../utils/logger.util';

// Crear una instancia de logger para este controlador
const logger = createLogger('EntregaController');

// GET /api/entregas
export const getAllEntregas = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;
    const total = await prisma.entrega.count();

    const entregas = await prisma.entrega.findMany({
      skip,
      take: pageSize,
      include: {
        paciente: true,
        doctor: true,
        personal: true,
        entregaDetalles: {
          include: {
            medicamento: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    return res.status(200).json({
      data: entregas,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error: any) {
    logger.error('Error al obtener entregas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/entregas/user
export const getEntregasByUser = async (req: Request, res: Response) => {
  try {
    const personalId = req.user?.pid;
    if (!personalId) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const total = await prisma.entrega.count({
      where: {
        personalId,
      }
    });

    const entregas = await prisma.entrega.findMany({
      skip,
      take: pageSize,
      where: {
        personalId,
      },
      include: {
        paciente: true,
        doctor: true,
        personal: true,
        entregaDetalles: {
          include: {
            medicamento: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    return res.status(200).json({
      data: entregas,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error: any) {
    logger.error('Error al obtener entregas del usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/entregas/:id
export const getEntregaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entrega = await prisma.entrega.findUnique({
      where: { id: Number(id) },
      include: {
        paciente: true,
        doctor: true,
        personal: true,
        entregaDetalles: {
          include: {
            medicamento: true,
          },
        },
      },
    });
    if (!entrega) {
      return res.status(404).json({ message: 'Entrega no encontrada' });
    }
    return res.status(200).json(entrega);
  } catch (error: any) {
    logger.error('Error al obtener entrega por ID:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/entregas (Función descontinuada)
export const createEntrega = async (req: Request, res: Response) => {
  return res.status(501).json({ message: 'Esta funcionalidad ha sido descontinuada' });
};


// DELETE /api/entregas/:id
export const deleteEntrega = async (req: Request, res: Response) => {
  const { id } = req.params;
  const entregaId = parseInt(id);

  try {
    // Usamos una transacción para asegurar la integridad de los datos
    await prisma.$transaction(async (tx) => {
      // 1. Encontrar la entrega y sus detalles
      const entrega = await tx.entrega.findUnique({
        where: { id: entregaId },
        include: {
          entregaDetalles: {
            select: {
              medicamentoId: true,
              cantidad: true,
            },
          },
        },
      });

      if (!entrega) {
        throw new Error('Entrega no encontrada.');
      }

      // 2. Devolver la cantidad de cada medicamento al inventario
      for (const item of entrega.entregaDetalles) {
        await tx.medicamento.update({
          where: { id: item.medicamentoId },
          data: {
            cantidadActual: {
              increment: item.cantidad, // Incrementa el stock
            },
          },
        });
      }

      // 3. Eliminar los registros de la tabla intermedia (EntregaDetalle)
      await tx.entregaDetalle.deleteMany({
        where: { entregaId: entregaId },
      });

      // 4. Finalmente, eliminar el registro principal de la entrega
      await tx.entrega.delete({
        where: { id: entregaId },
      });
    });

    res.status(200).json({ message: 'Entrega eliminada y stock restaurado correctamente.' });

  } catch (error: any) {
    console.error('Error al eliminar la entrega:', error);
    if (error.message === 'Entrega no encontrada.') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error interno del servidor al eliminar la entrega.' });
  }
};

export const getPaginatedEntregas = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const pacienteId = req.query.pacienteId ? parseInt(req.query.pacienteId as string) : undefined;
    const doctorId = req.query.doctorId ? parseInt(req.query.doctorId as string) : undefined;
    const personalId = req.query.personalId ? parseInt(req.query.personalId as string) : undefined;
    const tipoConsulta = req.query.tipoConsulta as string;

    const where: any = {};
    if (startDate && endDate) { where.fecha = { gte: startDate, lte: endDate }; }
    else if (startDate) { where.fecha = { gte: startDate }; }
    else if (endDate) { where.fecha = { lte: endDate }; }
    if (pacienteId) { where.pacienteId = pacienteId; }
    if (doctorId) { where.doctorId = doctorId; }
    if (personalId) { where.personalId = personalId; }
    if (tipoConsulta) {
      if (tipoConsulta === 'general') { where.general = 1; }
      else if (tipoConsulta === 'dental') { where.dental = 1; }
      else if (tipoConsulta === 'vales') { where.vales = 1; }
    }

    const totalCount = await prisma.entrega.count({ where });
    const totalPages = Math.ceil(totalCount / pageSize);

    const entregas = await prisma.entrega.findMany({
      where,
      include: {
        paciente: true,
        doctor: true,
        personal: true,
        entregaDetalles: { include: { medicamento: true } },
      },
      orderBy: { fecha: 'desc' },
      skip,
      take: pageSize,
    });

    return res.status(200).json({
      data: entregas,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener entregas paginadas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const createManualEntrega = async (req: Request, res: Response) => {
  try {
    const { paciente, doctorId, tipoConsulta, medicamentos, personalId: requestPersonalId, entregaId } = req.body;
    const isUpdate = entregaId !== undefined;
    const personalIdFromToken = req.user?.pid;

    if (!personalIdFromToken) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    let personalId: number;
    if (requestPersonalId) {
      const personalExists = await prisma.personal.findUnique({ where: { id: Number(requestPersonalId) } });
      if (!personalExists) {
        return res.status(404).json({ message: 'Error: El personal con ID proporcionado no existe' });
      }
      personalId = Number(requestPersonalId);
    } else {
      personalId = personalIdFromToken;
    }

    const validationErrors = [];
    if (!paciente || typeof paciente !== 'object' || !paciente.nombre || !paciente.curp) {
      validationErrors.push('Datos del paciente incompletos o inválidos');
    }
    if (doctorId === undefined || isNaN(Number(doctorId))) {
      validationErrors.push('Debes de seleccionar un doctor');
    }
    if (!tipoConsulta || !['general', 'dental', 'vales'].includes(tipoConsulta)) {
      validationErrors.push('Debes de seleccionar un tipo de consulta');
    }
    if (!medicamentos || !Array.isArray(medicamentos) || medicamentos.length === 0) {
      validationErrors.push('La lista de medicamentos es requerida y no puede estar vacía');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ message: 'Error de validación', errors: validationErrors });
    }

    const clave = `ENT-MAN-${Date.now()}`;

    let pacienteRecord = await prisma.paciente.findUnique({ where: { curp: paciente.curp } });
    if (!pacienteRecord) {
      pacienteRecord = await prisma.paciente.create({ data: { nombre: paciente.nombre, curp: paciente.curp } });
    }

    for (const med of medicamentos as Array<{ id: number; cantidad: number }>) {
      const medicamentoDb = await prisma.medicamento.findUnique({ where: { id: med.id } });
      if (!medicamentoDb || medicamentoDb.cantidadActual < med.cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para el medicamento ${medicamentoDb?.nombre || `ID ${med.id}`}` });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const entregaData = {
        clave,
        general: tipoConsulta === 'general' ? 1 : 0,
        dental: tipoConsulta === 'dental' ? 1 : 0,
        vales: tipoConsulta === 'vales' ? 1 : 0,
        pacienteId: pacienteRecord!.id,
        doctorId: Number(doctorId),
        personalId: Number(personalId),
      };

      const entrega = await tx.entrega.create({
        data: {
          ...entregaData,
          entregaDetalles: {
            create: medicamentos.map((m: { id: number; cantidad: number; }) => ({
              medicamentoId: m.id,
              cantidad: m.cantidad
            }))
          }
        }
      });

      for (const med of medicamentos as Array<{ id: number; cantidad: number }>) {
        await tx.medicamento.update({
          where: { id: med.id },
          data: { cantidadActual: { decrement: med.cantidad } }
        });
      }

      return entrega;
    });

    const entregaCompleta = await prisma.entrega.findUnique({
      where: { id: result.id },
      include: {
        paciente: true,
        doctor: true,
        personal: true,
        entregaDetalles: { include: { medicamento: true } },
      },
    });

    return res.status(isUpdate ? 200 : 201).json(entregaCompleta);

  } catch (error) {
    logger.error('Error al crear entrega manual:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
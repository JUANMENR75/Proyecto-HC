import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Obtener todos los pacientes
export const getAllPacientes = async (req: Request, res: Response) => {
  try {
    const pacientes = await prisma.paciente.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });

    return res.status(200).json(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener paciente por ID
export const getPacienteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const paciente = await prisma.paciente.findUnique({
      where: { id: Number(id) },
    });

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    return res.status(200).json(paciente);
  } catch (error) {
    console.error('Error al obtener paciente por ID:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener paciente por CURP
export const getPacienteByCurp = async (req: Request, res: Response) => {
  try {
    const { curp } = req.params;

    const paciente = await prisma.paciente.findUnique({
      where: { curp },
    });

    if (!paciente) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    return res.status(200).json(paciente);
  } catch (error) {
    console.error('Error al obtener paciente por CURP:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear nuevo paciente
export const createPaciente = async (req: Request, res: Response) => {
  try {
    const { nombre, curp } = req.body;

    // Validar solicitud
    if (!nombre || !curp) {
      return res.status(400).json({ message: 'Nombre y CURP son requeridos' });
    }

    // Verificar si ya existe un paciente con el mismo CURP
    const existingPaciente = await prisma.paciente.findUnique({
      where: { curp },
    });

    if (existingPaciente) {
      return res.status(400).json({ message: 'Ya existe un paciente con este CURP' });
    }

    const newPaciente = await prisma.paciente.create({
      data: {
        nombre,
        curp,
      },
    });

    return res.status(201).json(newPaciente);
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar paciente
export const updatePaciente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, curp } = req.body;

    // Validar solicitud
    if (!nombre && !curp) {
      return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar' });
    }

    // Verificar si el paciente existe
    const pacienteExists = await prisma.paciente.findUnique({
      where: { id: Number(id) },
    });

    if (!pacienteExists) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    // Si se está actualizando la CURP, verificar si la nueva CURP ya existe
    if (curp && curp !== pacienteExists.curp) {
      const existingPaciente = await prisma.paciente.findUnique({
        where: { curp },
      });

      if (existingPaciente) {
        return res.status(400).json({ message: 'Ya existe un paciente con este CURP' });
      }
    }

    // Actualizar paciente
    const updatedPaciente = await prisma.paciente.update({
      where: { id: Number(id) },
      data: {
        ...(nombre && { nombre }),
        ...(curp && { curp }),
      },
    });

    return res.status(200).json(updatedPaciente);
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar paciente
export const deletePaciente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si el paciente existe
    const pacienteExists = await prisma.paciente.findUnique({
      where: { id: Number(id) },
    });

    if (!pacienteExists) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const hasEntregas = await prisma.entrega.findFirst({
      where: { pacienteId: Number(id) },
    });

    if (hasEntregas) {
      return res.status(400).json({ 
        message: 'No se puede eliminar paciente con registros relacionados. Elimine los registros relacionados primero.' 
      });
    }

    // Eliminar paciente
    await prisma.paciente.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({ message: 'Paciente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// Obtener todos los doctores
export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: {
        nombre: 'asc',
      }
    });

    return res.status(200).json(doctors);
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener doctor por ID
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id: Number(id) },
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    return res.status(200).json(doctor);
  } catch (error) {
    console.error('Error al obtener doctor por ID:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear nuevo doctor
export const createDoctor = async (req: Request, res: Response) => {
  try {
    const { nombre, especialidad } = req.body;

    // Validar respuesta
    if (!nombre || !especialidad) {
      return res.status(400).json({ message: 'Se requiere nombre y especialidad' });
    }

    // Crear doctor
    const newDoctor = await prisma.doctor.create({
      data: {
        nombre,
        especialidad,
      },
    });

    return res.status(201).json(newDoctor);
  } catch (error) {
    console.error('Error al crear doctor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar doctor
export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, especialidad } = req.body;

    // Validar respuesta
    if (!nombre && !especialidad) {
      return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar' });
    }

    // Checar si el doctor existe
    const doctorExists = await prisma.doctor.findUnique({
      where: { id: Number(id) }
    });

    if (!doctorExists) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    // Preparar datos para la actualización del doctor
    const doctorUpdateData = {
      ...(nombre && { nombre }),
      ...(especialidad && { especialidad }),
    };

    // Actualizar doctor
    const updatedDoctor = await prisma.doctor.update({
      where: { id: Number(id) },
      data: doctorUpdateData
    });

    return res.status(200).json(updatedDoctor);
  } catch (error) {
    console.error('Error al actualizar doctor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Eliminar doctor
export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Checar si el doctor existe
    const doctorExists = await prisma.doctor.findUnique({
      where: { id: Number(id) },
    });

    if (!doctorExists) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const hasEntregas = await prisma.entrega.findFirst({
      where: { doctorId: Number(id) },
    });

    if (hasEntregas) {
      return res.status(400).json({ 
        message: 'No se puede eliminar al doctor con registros relacionados. Primero elimine los registros relacionados.'
      });
    }

    // Eliminar doctor
    await prisma.doctor.delete({
      where: { id: Number(id) },
    });

    return res.status(200).json({ message: 'Doctor eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar doctor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

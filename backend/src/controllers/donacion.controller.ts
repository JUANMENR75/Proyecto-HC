import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import type { Donacion } from '@prisma/client';

// GET /api/donaciones - Obtiene todas las donaciones
export const getAllDonaciones = async (req: Request, res: Response) => {
  try {
    console.log('GET /api/donaciones - Solicitud recibida:', req.path, req.method);
    
    const donaciones = await prisma.donacion.findMany({
      orderBy: {
        fecha: 'desc',
      },
    });
    
    console.log('GET /api/donaciones - Donaciones encontradas:', donaciones.length);
    
    // Transformar al formato esperado por el frontend
    const formattedDonaciones = donaciones.map((donacion: Donacion) => ({
      id: donacion.id.toString(),
      nombre: donacion.nombre,
      cantidad: donacion.cantidad,
      fecha: donacion.fecha.toISOString(),
    }));
    
    console.log('GET /api/donaciones - Enviando respuesta:', formattedDonaciones.length, 'elementos');
    return res.status(200).json(formattedDonaciones);
  } catch (error) {
    console.error('Error al obtener las donaciones:', error);
    return res.status(500).json({ message: 'Error al obtener las donaciones' });
  }
};

// POST /api/donaciones - Crea una nueva donación
export const createDonacion = async (req: Request, res: Response) => {
  try {
    const { nombre, cantidad, fecha } = req.body;
    
    if (!nombre || !cantidad) {
      return res.status(400).json({ message: 'Nombre y cantidad son requeridos' });
    }
    
    const nuevaDonacion = await prisma.donacion.create({
      data: {
        nombre,
        cantidad: Number(cantidad),
        fecha: fecha ? new Date(fecha) : new Date(),
      },
    });
    
    return res.status(201).json({
      id: nuevaDonacion.id.toString(),
      nombre: nuevaDonacion.nombre,
      cantidad: nuevaDonacion.cantidad,
      fecha: nuevaDonacion.fecha.toISOString(),
    });
  } catch (error) {
    console.error('Error al crear la donación:', error);
    return res.status(500).json({ message: 'Error al crear la donación' });
  }
};

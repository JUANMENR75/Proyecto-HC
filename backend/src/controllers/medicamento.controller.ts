import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET /api/medicamentos/activity-logs
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    console.log('GET /api/medicamentos/activity-logs - Solicitud recibida:', req.path, req.method);
    
    // Obtener actualizaciones recientes de inventario
    const inventoryUpdates = await prisma.medicamento.findMany({
      select: {
        id: true,
        nombre: true,
        clave: true,
        cantidadActual: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    });
    
    console.log('GET /api/medicamentos/activity-logs - Actualizaciones de inventario encontradas:', inventoryUpdates.length);
    
    // Obtener detalles recientes de entrega
    const entregaDetails = await prisma.entregaDetalle.findMany({
      select: {
        id: true,
        cantidad: true,
        createdAt: true,
        medicamento: {
          select: {
            nombre: true,
            clave: true
          }
        },
        entrega: {
          select: {
            fecha: true,
            personal: {
              select: {
                nombre: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log('GET /api/medicamentos/activity-logs - Detalles de entrega encontrados:', entregaDetails.length);
    
    // Formatear los registros de actividad
    const activityLogs = {
      inventoryUpdates: inventoryUpdates.map(update => ({
        type: 'inventory',
        medicamentoId: update.id,
        medicamentoNombre: update.nombre,
        medicamentoClave: update.clave,
        cantidad: update.cantidadActual,
        fecha: update.updatedAt
      })),
      entregaDetails: entregaDetails.map(detail => ({
        type: 'entrega',
        id: detail.id,
        medicamentoNombre: detail.medicamento.nombre,
        medicamentoClave: detail.medicamento.clave,
        cantidad: detail.cantidad,
        fecha: detail.entrega.fecha,
        personalNombre: detail.entrega.personal.nombre
      }))
    };
    
    console.log('GET /api/medicamentos/activity-logs - Enviando respuesta con actualizaciones de inventario:',
                activityLogs.inventoryUpdates.length, 'artículos y detalles de entrega:',
                activityLogs.entregaDetails.length, 'items');
    
    return res.status(200).json(activityLogs);
  } catch (error) {
    console.error('Error al obtener logs de actividad:', error);
    return res.status(500).json({ message: 'Error al obtener logs de actividad' });
  }
};

// Obtener todos los medicamentos
export const getAllMedicamentos = async (req: Request, res: Response) => {
  try {
    console.log('GET /api/medicamentos - Solicitud recibida:', req.path, req.method);
    
    const medicamentos = await prisma.medicamento.findMany({
      orderBy: {
        nombre: 'asc',
      },
    });

    console.log('GET /api/medicamentos - Medicamentos encontrados:', medicamentos.length);
    console.log('GET /api/medicamentos - Enviando respuesta');
    
    return res.status(200).json(medicamentos);
  } catch (error) {
    console.error('Error al obtener medicamentos:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener medicamento por ID
export const getMedicamentoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const medicamento = await prisma.medicamento.findUnique({
      where: { id: Number(id) },
    });

    if (!medicamento) {
      return res.status(404).json({ message: 'Medicamento no encontrado' });
    }

    return res.status(200).json(medicamento);
  } catch (error) {
    console.error('Error al obtener medicamento por ID:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener medicamento por clave
export const getMedicamentoByClave = async (req: Request, res: Response) => {
  try {
    const { clave } = req.params;

    const medicamento = await prisma.medicamento.findUnique({
      where: { clave },
    });

    if (!medicamento) {
      return res.status(404).json({ message: 'Medicamento no encontrado' });
    }

    return res.status(200).json(medicamento);
  } catch (error) {
    console.error('Error al obtener medicamento por clave:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Crear nuevo medicamento
export const createMedicamento = async (req: Request, res: Response) => {
  try {
    const { clave, nombre, cantidadActual, fechaCaducidad } = req.body;

    // Validar solicitud
    if (!clave || !nombre || !fechaCaducidad) {
      return res.status(400).json({ 
        message: 'Clave, nombre y fecha de caducidad son requeridos'
      });
    }

    // Verificar si ya existe un medicamento con la misma clave
    const existingMedicamento = await prisma.medicamento.findUnique({
      where: { clave },
    });

    if (existingMedicamento) {
      return res.status(400).json({ 
        message: 'Ya existe un medicamento con esta clave' 
      });
    }

    const newMedicamento = await prisma.medicamento.create({
      data: {
        clave,
        nombre,
        cantidadActual: cantidadActual || 0,
        fechaCaducidad: new Date(fechaCaducidad),
      },
    });

    return res.status(201).json(newMedicamento);
  } catch (error) {
    console.error('Error al crear medicamento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Actualizar medicamento
export const updateMedicamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clave, nombre, cantidadActual, fechaCaducidad } = req.body;

    // Validar solicitud - verificar si se proporciona al menos un campo válido
    if (
      (clave === undefined || clave === null || clave === '') && 
      (nombre === undefined || nombre === null || nombre === '') && 
      cantidadActual === undefined && 
      (fechaCaducidad === undefined || fechaCaducidad === null || fechaCaducidad === '')
    ) {
      return res.status(400).json({ 
        message: 'Se requiere al menos un campo para actualizar' 
      });
    }

    // Verificar si existe el medicamento
    const medicamentoExists = await prisma.medicamento.findUnique({
      where: { id: Number(id) },
    });

    if (!medicamentoExists) {
      return res.status(404).json({ message: 'Medicamento no encontrado' });
    }

    // Si se está actualizando la clave, verificar si la nueva clave ya existe
    if (clave && clave !== medicamentoExists.clave) {
      const existingMedicamento = await prisma.medicamento.findUnique({
        where: { clave },
      });

      if (existingMedicamento) {
        return res.status(400).json({ 
          message: 'Ya existe un medicamento con esta clave' 
        });
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (clave !== undefined && clave !== null && clave !== '') {
      updateData.clave = clave;
    }

    if (nombre !== undefined && nombre !== null && nombre !== '') {
      updateData.nombre = nombre;
    }

    if (cantidadActual !== undefined) {
      updateData.cantidadActual = cantidadActual;
    }

    if (fechaCaducidad !== undefined && fechaCaducidad !== null && fechaCaducidad !== '') {
      try {
        updateData.fechaCaducidad = new Date(fechaCaducidad);
      } catch (dateError) {
        return res.status(400).json({ 
          message: 'Formato de fecha inválido para fechaCaducidad' 
        });
      }
    }

    // Actualizar medicamento
    const updatedMedicamento = await prisma.medicamento.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return res.status(200).json(updatedMedicamento);
  } catch (error) {
    console.error('Error al actualizar medicamento:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Eliminar medicamento
export const deleteMedicamento = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const medicamentoId = Number(id);

    // Verificar si existe el medicamento
    const medicamentoExists = await prisma.medicamento.findUnique({
      where: { id: medicamentoId },
      include: {
        entregaDetalles: true,
      }
    });

    if (!medicamentoExists) {
      return res.status(404).json({ message: 'Medicamento no encontrado' });
    }

    // Verificar si el medicamento está referenciado en algún EntregaDetalle
    if (medicamentoExists.entregaDetalles.length > 0) {
      // Eliminar primero los registros de EntregaDetalle relacionados
      await prisma.entregaDetalle.deleteMany({
        where: { medicamentoId }
      });
    }

    // Ahora eliminar el medicamento
    await prisma.medicamento.delete({
      where: { id: medicamentoId },
    });

    return res.status(200).json({ message: 'Medicamento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar medicamento:', error);
    return res.status(500).json({ 
      message: 'Error al eliminar el medicamento. Puede estar siendo utilizado en entregas.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Actualizar cantidad de inventario
export const updateInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    // Validar solicitud
    if (cantidad === undefined) {
      return res.status(400).json({ message: 'Se requiere la cantidad' });
    }

    // Verificar si existe el medicamento
    const medicamento = await prisma.medicamento.findUnique({
      where: { id: Number(id) },
    });

    if (!medicamento) {
      return res.status(404).json({ message: 'Medicamento no encontrado' });
    }

    // Calcular nueva cantidad
    const newCantidad = medicamento.cantidadActual + Number(cantidad);

    // Asegurar que la cantidad no sea menor que cero
    if (newCantidad < 0) {
      return res.status(400).json({ 
        message: 'Inventario insuficiente. Cantidad actual: ' + medicamento.cantidadActual 
      });
    }

    // Actualizar cantidad del medicamento
    const updatedMedicamento = await prisma.medicamento.update({
      where: { id: Number(id) },
      data: {
        cantidadActual: newCantidad,
      },
    });

    return res.status(200).json(updatedMedicamento);
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
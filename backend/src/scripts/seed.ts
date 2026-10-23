import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes
  await prisma.entregaDetalle.deleteMany();
  await prisma.entrega.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.personal.deleteMany();
  await prisma.medicamento.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuarios
  const adminUser = await prisma.user.create({
    data: {
      nombre: 'Administrador',
      email: 'admin@hospital.com',
      passwordHash: await bcrypt.hash('admin7404', 10),
      role: "ADMIN",
    },
  });

  const encargadoUser = await prisma.user.create({
    data: {
      nombre: 'Encargado Farmacia',
      email: 'farmacia@hospital.com',
      passwordHash: await bcrypt.hash('farmacia7404', 10),
      role: "ENCARGADO",
    },
  });

  const doctorUser = await prisma.user.create({
    data: {
      nombre: 'Dr. Juan Pérez Hinojosa',
      email: 'doctor@hospital.com',
      passwordHash: await bcrypt.hash('doctor7404', 10),
      role: "DOCTOR",
    },
  });

  // Crear un usuario adicional
  const enfermeraUser = await prisma.user.create({
    data: {
      nombre: 'María López',
      email: 'enfermera@hospital.com',
      passwordHash: await bcrypt.hash('enfermera7404', 10),
      role: "ENCARGADO",
    },
  });

  // Crear personal con conexiones a usuarios
  const personal1 = await prisma.personal.create({
    data: {
      nombre: 'María López',
      puesto: 'Enfermera',
      user: {
        connect: {
          id: enfermeraUser.id
        }
      }
    },
  });

  await prisma.personal.create({
    data: {
      nombre: 'Carlos Rodríguez',
      puesto: 'Encargado Farmacia',
      user: {
        connect: {
          id: encargadoUser.id
        }
      }
    },
  });

  // Crear medicamentos
  const medicamento1 = await prisma.medicamento.create({
    data: {
      clave: 'MED001',
      nombre: 'Paracetamol 500mg',
      cantidadActual: 100,
      fechaCaducidad: new Date('2025-12-31'),
    },
  });

  const medicamento2 = await prisma.medicamento.create({
    data: {
      clave: 'MED002',
      nombre: 'Ibuprofeno 400mg',
      cantidadActual: 80,
      fechaCaducidad: new Date('2025-10-15'),
    },
  });

  await prisma.medicamento.create({
    data: {
      clave: 'MED003',
      nombre: 'Amoxicilina 500mg',
      cantidadActual: 50,
      fechaCaducidad: new Date('2024-08-20'),
    },
  });

  // Crear pacientes
  const paciente1 = await prisma.paciente.create({
    data: {
      nombre: 'Ana García',
      curp: 'GARA800101MDFNRN01',
    },
  });

  await prisma.paciente.create({
    data: {
      nombre: 'Roberto Martínez',
      curp: 'MARR750215HDFBRT02',
    },
  });

  // Crear doctores
  const doctor1 = await prisma.doctor.create({
    data: {
      nombre: 'Dr. Juan Pérez',
      especialidad: 'Medicina General',
    },
  });

  await prisma.doctor.create({
    data: {
      nombre: 'Dra. Laura Sánchez',
      especialidad: 'Odontología',
    },
  });


  // Crear entrega con múltiples medicamentos (detalles)
  await prisma.entrega.create({
    data: {
      clave: 'ENT001-2023',
      general: 1,
      dental: 0,
      vales: 0,
      pacienteId: paciente1.id,
      doctorId: doctor1.id,
      personalId: personal1.id,
      entregaDetalles: {
        create: [
          {
            medicamentoId: medicamento1.id, // Paracetamol 500mg
            cantidad: 3,
          },
          {
            medicamentoId: medicamento2.id, // Ibuprofeno 400mg
            cantidad: 2,
          },
        ],
      },
    },
  });

  console.log('Base de datos poblada correctamente!');
}

main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });

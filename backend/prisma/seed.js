require('dotenv').config({
  path: process.env.NODE_ENV_DB_PATH || '.env'
});

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  try {
    await prisma.entregaDetalle.deleteMany({});
    await prisma.entrega.deleteMany();
    await prisma.paciente.deleteMany();
    await prisma.doctor.deleteMany();
    await prisma.personal.deleteMany();
    await prisma.refreshToken.deleteMany({});
    await prisma.medicamento.deleteMany({});
    await prisma.user.deleteMany();

    console.log('Existing data cleaned up');

    // --- Crear Usuarios y su Personal correspondiente ---

    // 1. Crear Admin User y su Personal
    const adminUser = await prisma.user.create({
      data: {
        nombre: 'Administrador',
        email: 'admin@hospital.com',
        passwordHash: await bcrypt.hash('admin7404', 10),
        role: "ADMIN",
      },
    });

    await prisma.personal.create({
      data: {
        nombre: 'Administrador',
        puesto: 'Administrador del Sistema',
        user: {
          connect: {
            id: adminUser.id,
          },
        },
      },
    });

    // 2. Crear Encargado User y su Personal
    const encargadoUser = await prisma.user.create({
      data: {
        nombre: 'Encargado Farmacia',
        email: 'farmacia@hospital.com',
        passwordHash: await bcrypt.hash('farmacia7404', 10),
        role: "ENCARGADO",
      },
    });

    await prisma.personal.create({
      data: {
        nombre: 'Carlos Rodríguez',
        puesto: 'Encargado Farmacia',
        user: {
          connect: {
            id: encargadoUser.id,
          },
        },
      },
    });

    // 3. Crear Doctor User y su Personal
    const doctorUser = await prisma.user.create({
      data: {
        nombre: 'Dr. Juan Pérez Hinojosa',
        email: 'doctor@hospital.com',
        passwordHash: await bcrypt.hash('doctor7404', 10),
        role: "DOCTOR",
      },
    });

    await prisma.personal.create({
      data: {
        nombre: 'Dr. Juan Pérez Hinojosa',
        puesto: 'Médico General',
        user: {
          connect: {
            id: doctorUser.id,
          },
        },
      },
    });

    console.log('Created users and personal records');

    // --- Crear el resto de los datos (Medicamentos, Pacientes, etc.) ---

    await prisma.medicamento.createMany({
      data: [
        { clave: 'MED001', nombre: 'Paracetamol 500mg', cantidadActual: 100, fechaCaducidad: new Date('2025-12-31') },
        { clave: 'MED002', nombre: 'Ibuprofeno 400mg', cantidadActual: 80, fechaCaducidad: new Date('2025-10-15') },
        { clave: 'MED003', nombre: 'Amoxicilina 500mg', cantidadActual: 50, fechaCaducidad: new Date('2024-08-20') },
      ]
    });
    console.log('Created medicamentos');

    await prisma.paciente.createMany({
      data: [
        { nombre: 'Ana García', curp: 'GARA800101MDFNRN01' },
        { nombre: 'Roberto Martínez', curp: 'MARR750215HDFBRT02' },
      ]
    });
    console.log('Created pacientes');

    await prisma.doctor.createMany({
      data: [
        { nombre: 'Dr. Juan Pérez', especialidad: 'Medicina General' },
        { nombre: 'Dra. Laura Sánchez', especialidad: 'Odontología' },
      ]
    });
    console.log('Created doctores');

    console.log('Database seeding completed successfully');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
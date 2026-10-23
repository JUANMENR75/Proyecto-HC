require('dotenv').config({
  path: process.env.NODE_ENV_DB_PATH || '.env'
});

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

async function exportData() {
  console.log('Connecting to local database...');
  const prisma = new PrismaClient();

  try {
    console.log('Exporting data...');

    // Exportar todas las tablas
    const users = await prisma.user.findMany();
    const personal = await prisma.personal.findMany();
    const medicamentos = await prisma.medicamento.findMany();
    const pacientes = await prisma.paciente.findMany();
    const doctores = await prisma.doctor.findMany();
    const entregas = await prisma.entrega.findMany();
    const entregaDetalles = await prisma.entregaDetalle.findMany();

    fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(users, null, 2));
    fs.writeFileSync(path.join(dataDir, 'personal.json'), JSON.stringify(personal, null, 2));
    fs.writeFileSync(path.join(dataDir, 'medicamentos.json'), JSON.stringify(medicamentos, null, 2));
    fs.writeFileSync(path.join(dataDir, 'pacientes.json'), JSON.stringify(pacientes, null, 2));
    fs.writeFileSync(path.join(dataDir, 'doctores.json'), JSON.stringify(doctores, null, 2));
    fs.writeFileSync(path.join(dataDir, 'entregas.json'), JSON.stringify(entregas, null, 2));
    fs.writeFileSync(path.join(dataDir, 'entregaDetalles.json'), JSON.stringify(entregaDetalles, null, 2));

    console.log('Data exported successfully to', dataDir);
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para importar datos para la base de datos del Vps
async function importData() {
  console.log('Connecting to database using configuration from:', process.env.NODE_ENV_DB_PATH || '.env');

  // Crear una nueva instancia PrismaClient con conexión de las variables de entorno
  const prisma = new PrismaClient();

  try {
    console.log('Importing data...');

    // Leer JSON files
    const users = JSON.parse(fs.readFileSync(path.join(dataDir, 'users.json'), 'utf8'));
    const personal = JSON.parse(fs.readFileSync(path.join(dataDir, 'personal.json'), 'utf8'));
    const medicamentos = JSON.parse(fs.readFileSync(path.join(dataDir, 'medicamentos.json'), 'utf8'));
    const pacientes = JSON.parse(fs.readFileSync(path.join(dataDir, 'pacientes.json'), 'utf8'));
    const doctores = JSON.parse(fs.readFileSync(path.join(dataDir, 'doctores.json'), 'utf8'));
    const entregas = JSON.parse(fs.readFileSync(path.join(dataDir, 'entregas.json'), 'utf8'));
    const entregaDetalles = JSON.parse(fs.readFileSync(path.join(dataDir, 'entregaDetalles.json'), 'utf8'));

    // Importar usuarios
    console.log('Importing users...');
    for (const user of users) {
      await prisma.user.create({
        data: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          passwordHash: user.passwordHash,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }

    // Importar personal
    console.log('Importing personal...');
    for (const p of personal) {
      await prisma.personal.create({
        data: {
          id: p.id,
          nombre: p.nombre,
          puesto: p.puesto,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          userId: p.userId
        }
      });
    }

    // Importar medicamentos
    console.log('Importing medicamentos...');
    for (const m of medicamentos) {
      await prisma.medicamento.create({
        data: {
          id: m.id,
          clave: m.clave,
          nombre: m.nombre,
          cantidadActual: m.cantidadActual,
          fechaCaducidad: new Date(m.fechaCaducidad),
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt)
        }
      });
    }

    // Importar pacientes
    console.log('Importing pacientes...');
    for (const p of pacientes) {
      await prisma.paciente.create({
        data: {
          id: p.id,
          nombre: p.nombre,
          curp: p.curp,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }
      });
    }

    // Importar doctores
    console.log('Importing doctores...');
    for (const d of doctores) {
      await prisma.doctor.create({
        data: {
          id: d.id,
          nombre: d.nombre,
          especialidad: d.especialidad,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt)
        }
      });
    }

    // Importar entregas
    console.log('Importing entregas...');
    for (const e of entregas) {
      await prisma.entrega.create({
        data: {
          id: e.id,
          clave: e.clave,
          general: e.general,
          dental: e.dental,
          vales: e.vales,
          fecha: new Date(e.fecha),
          pacienteId: e.pacienteId,
          doctorId: e.doctorId,
          personalId: e.personalId,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt)
        }
      });
    }

    // Importar entregaDetalles
    console.log('Importing entregaDetalles...');
    for (const ed of entregaDetalles) {
      await prisma.entregaDetalle.create({
        data: {
          id: ed.id,
          entregaId: ed.entregaId,
          medicamentoId: ed.medicamentoId,
          cantidad: ed.cantidad,
          createdAt: new Date(ed.createdAt),
          updatedAt: new Date(ed.updatedAt)
        }
      });
    }

    console.log('Data imported successfully to VPS database');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Función Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'export') {
    await exportData();
  } else if (args[0] === 'import') {
    await importData();
  } else {
    console.log(`
Usage:
  node migrate-data.js export                    # Export data from local database
  node migrate-data.js import                    # Import data to database specified by NODE_ENV_DB_PATH

Example:
  NODE_ENV_DB_PATH=.env.cloud node migrate-data.js import
`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

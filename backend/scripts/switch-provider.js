// Este script cambia el proveedor de base de datos en schema.prisma basado en el entorno
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({
  path: process.env.NODE_ENV_DB_PATH || '.env'
});

// Obtener la URL de la base de datos de las variables de entorno
const databaseUrl = process.env.DATABASE_URL;

// Determinar el proveedor según la URL de la base de datos
let provider = 'mysql'; // Default provider
if (databaseUrl && databaseUrl.startsWith('file:')) {
  provider = 'sqlite';
}

console.log(`Switching database provider to: ${provider}`);

// Ruta al archivo schema.prisma
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Leer el archivo schema.prisma
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Reemplazar el proveedor
schemaContent = schemaContent.replace(
  /provider = ".*"/,
  `provider = "${provider}"`
);

// Escribe el archivo schema.prisma actualizado
fs.writeFileSync(schemaPath, schemaContent);

console.log(`Updated schema.prisma with provider: ${provider}`);
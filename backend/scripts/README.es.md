# Script de Migración de Datos

Este script te ayuda a migrar datos desde tu base de datos local a tu base de datos en VPS.

## Requisitos Previos

- Node.js instalado
- Cliente Prisma instalado (`npm install @prisma/client`)
- Acceso a ambas bases de datos (local y VPS)

## Cómo Usar

Puedes usar este script de dos maneras: a través del archivo batch interactivo o ejecutando comandos directamente.

### Opción 1: Usando el Archivo Batch (Recomendado)

1. Navega al directorio `scripts` en tu línea de comandos
2. Ejecuta el archivo batch en español:
   ```
   migrar.bat
   ```
3. Sigue las instrucciones en pantalla:
   - Elige la opción 1 para exportar datos de tu base de datos local
   - Elige la opción 2 para importar datos a tu base de datos VPS (se te pedirá la URL de la base de datos VPS)

### Opción 2: Usando Comandos Directos

#### Paso 1: Exportar Datos de la Base de Datos Local

Ejecuta el siguiente comando para exportar todos los datos de tu base de datos local a archivos JSON:

```bash
node scripts\migrate-data.js export
```

Esto creará una carpeta `data` dentro del directorio `scripts` que contendrá archivos JSON para cada tabla.

#### Paso 2: Importar Datos a la Base de Datos VPS

Ejecuta el siguiente comando para importar los datos a tu base de datos VPS:

```bash
node scripts\migrate-data.js import "mysql://usuario:contraseña@host-vps:3306/nombre_base_datos"
```

Reemplaza `"mysql://usuario:contraseña@host-vps:3306/nombre_base_datos"` con tu cadena de conexión real a la base de datos VPS.

## Qué Hace Este Script

1. **Exportación**: Extrae todos los registros de las siguientes tablas en tu base de datos local:
   - User (Usuario)
   - Personal
   - Medicamento
   - Paciente
   - Doctor
   - Entrega
   - EntregaDetalle

2. **Importación**: Importa todos los datos extraídos a tu base de datos VPS, preservando las relaciones entre tablas.

## Solución de Problemas

- Si encuentras errores durante la importación, verifica que tu base de datos VPS sea accesible y que las tablas hayan sido migradas correctamente.
- Asegúrate de que la cadena de conexión a tu base de datos VPS sea correcta.
- Si obtienes errores de clave duplicada, podría significar que algunos datos ya existen en la base de datos VPS.

## Nota

Este script modifica temporalmente tu archivo `.env` para conectarse a la base de datos VPS durante la importación, pero restaura la configuración original cuando termina.

# Backend del Sistema de Gestión de Medicamentos
*Última actualización: 2025-08-08*

Este es el backend para el Sistema de Gestión de Medicamentos (SGM), construido con Node.js, TypeScript, Express y Prisma.

## Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn

## Configuración

1. Clonar el repositorio
2. Navegar al directorio backend
3. Instalar dependencias:

```bash
npm install
# o
yarn install
```

4. Crear un archivo `.env` en la raíz del directorio backend con el siguiente contenido:

```
# Variables de entorno
NODE_ENV=development
PORT=3000

# Base de datos
DATABASE_URL="file:./dev.db"

# Autenticación
JWT_SECRET="tu-clave-secreta-jwt-super-segura-cambiar-en-produccion"
JWT_EXPIRES_IN="1d"
```

5. Generar el cliente Prisma:

```bash
npx prisma generate
```

6. Crear la base de datos y ejecutar migraciones:

```bash
npx prisma migrate dev
```

7. Poblar la base de datos con datos iniciales:

```bash
npm run seed
# o
yarn seed
```

## Ejecutar la Aplicación

### Modo Desarrollo

```bash
npm run dev
# o
yarn dev
```

### Modo Desarrollo con SQLite (Local)

Para iniciar la aplicación en modo desarrollo utilizando SQLite como base de datos:

```bash
npm run dev:sqlite
```

### Modo Desarrollo con MySQL a través de túnel SSH

Para iniciar la aplicación en modo desarrollo utilizando MySQL a través de un túnel SSH:

1. Asegúrate de que el archivo `.env` tenga la siguiente configuración:

```
# Database
DATABASE_PROVIDER="mysql"
DATABASE_URL="mysql://JUANMENR74:Confir7450@127.0.0.1:3306/SGM"

# SSH Tunnel Configuration
SSH_HOST="31.97.130.143"
SSH_PORT=22
SSH_USERNAME="your_ssh_username"
SSH_PASSWORD="your_ssh_password"
```

2. Reemplaza `your_ssh_username` y `your_ssh_password` con tus credenciales SSH reales.

3. Ejecuta el siguiente comando para iniciar el servidor con el túnel SSH:

```bash
npm run dev:ssh
```

Esto establecerá automáticamente un túnel SSH al servidor remoto y conectará el backend a la base de datos MySQL SGM.

### Poblar Datos en MySQL (VPS)

Para poblar la base de datos MySQL en el VPS con datos iniciales:

```bash
npm run seed:mysql
```

### Acceder a Prisma Studio en VPS

Para acceder a Prisma Studio y gestionar la base de datos MySQL en el VPS:

```bash
npm run studio:vps
```

### Modo Producción

```bash
npm run build
npm start
# o
yarn build
yarn start
```

## Endpoints de la API

### Autenticación

- `POST /api/auth/login` - Iniciar sesión de usuario
- `POST /api/auth/token` - Refrescar token de acceso
- `POST /api/auth/logout` - Cerrar sesión de usuario
- `GET /api/auth/profile` - Obtener perfil de usuario (protegido)

### Personal (solo ADMIN)

- `GET /api/personal` - Obtener todo el personal
- `GET /api/personal/:id` - Obtener personal por ID
- `POST /api/personal` - Crear nuevo personal
- `PUT /api/personal/:id` - Actualizar personal
- `DELETE /api/personal/:id` - Eliminar personal

### Medicamentos (solo ENCARGADO)

- `GET /api/medicamentos` - Obtener todos los medicamentos
- `GET /api/medicamentos/:id` - Obtener medicamento por ID
- `GET /api/medicamentos/clave/:clave` - Obtener medicamento por clave
- `POST /api/medicamentos` - Crear nuevo medicamento
- `PUT /api/medicamentos/:id` - Actualizar medicamento
- `DELETE /api/medicamentos/:id` - Eliminar medicamento
- `PATCH /api/medicamentos/:id/inventory` - Actualizar cantidad de inventario

### Pacientes (solo ENCARGADO)

- `GET /api/pacientes` - Obtener todos los pacientes
- `GET /api/pacientes/:id` - Obtener paciente por ID
- `GET /api/pacientes/curp/:curp` - Obtener paciente por CURP
- `POST /api/pacientes` - Crear nuevo paciente
- `PUT /api/pacientes/:id` - Actualizar paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente

### Personal Médico

- `GET /api/doctores` - Obtener todo el personal médico (todos los usuarios autenticados)
- `GET /api/doctores/:id` - Obtener personal médico por ID (todos los usuarios autenticados)
- `POST /api/doctores` - Crear nuevo personal médico (ADMIN o ENCARGADO)
- `PUT /api/doctores/:id` - Actualizar personal médico (ADMIN o ENCARGADO)
- `DELETE /api/doctores/:id` - Eliminar personal médico (ADMIN o ENCARGADO)

### Recetas (solo ENCARGADO)

- `GET /api/recetas` - Obtener todas las recetas
- `GET /api/recetas/:id` - Obtener receta por ID
- `GET /api/recetas/codigo/:codigoQR` - Obtener receta por código QR
- `POST /api/recetas` - Crear nueva receta (genera código QR)
- `PUT /api/recetas/:id` - Actualizar receta
- `DELETE /api/recetas/:id` - Eliminar receta

### Entregas (solo ENCARGADO)

- `GET /api/entregas` - Obtener todas las entregas
- `GET /api/entregas/user` - Obtener entregas del usuario actual
- `GET /api/entregas/:id` - Obtener entrega por ID
- `POST /api/entregas/manual` - Crear entrega manual de medicamentos
- `DELETE /api/entregas/:id` - Eliminar entrega

### Reportes

- `GET /api/reportes/diario` - Obtener reporte diario
- `GET /api/reportes/semanal` - Obtener reporte semanal
- `GET /api/reportes/mensual` - Obtener reporte mensual
- `GET /api/reportes/paginado` - Obtener reporte paginado con filtros

## Solución de Problemas

### Errores de TypeScript

Si encuentras errores de TypeScript como:
- TS2307: No se puede encontrar el módulo 'express' o sus declaraciones de tipo correspondientes
- TS2307: No se puede encontrar el módulo 'jsonwebtoken' o sus declaraciones de tipo correspondientes
- TS2307: No se puede encontrar el módulo 'bcrypt' o sus declaraciones de tipo correspondientes
- TS2580: No se puede encontrar el nombre 'process'

Prueba estas soluciones:

1. Asegúrate de haber instalado todas las dependencias con `npm install` o `yarn install`.

2. Si los errores persisten después de instalar las dependencias, es posible que debas actualizar tu archivo tsconfig.json para incluir explícitamente los tipos:

```json
{
  "compilerOptions": {
    "types": ["node", "express", "jsonwebtoken", "bcrypt"]
  }
}
```

3. Para el error "No se puede encontrar el nombre 'process'", necesitas incluir los tipos de Node.js. Esto ya está incluido en la solución anterior, pero si solo estás experimentando este error específico, puedes agregar solo los tipos de Node.js:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

4. Si sigues experimentando problemas, intenta reiniciar tu servidor TypeScript o tu IDE.


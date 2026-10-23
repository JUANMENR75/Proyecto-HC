# Sistema de Gestión de Medicamentos
*Última actualización: 2025-08-08*

Este proyecto es un sistema completo para la gestión de medicamentos: inventario, personal médico y pacientes. Está diseñado para facilitar el seguimiento de entregas de medicamentos y la gestión de recursos médicos.

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

### Frontend

La interfaz de usuario está desarrollada con React, TypeScript y Tailwind CSS, utilizando Vite como herramienta de construcción.

- **Páginas principales**:
  - Dashboard: Panel principal con resumen de información
  - Pacientes: Gestión de pacientes
  - Inventario: Control de medicamentos
  - DonacionesMedicamentos: Registro de donaciones de medicamentos
  - EntregaManualMedicamentos: Registro manual de entregas de medicamentos (con edición)
  - EntregasMedicamentos: Visualización de entregas realizadas
  - ReportesCombinados: Generación de reportes
  
- **Sistema de autenticación**:
  - Login: Autenticación de usuarios
  - Gestión automática de tokens con HTTP-only cookies
  - Refresco automático de tokens
  - Protección de rutas basada en roles
  - Cierre de sesión automático por inactividad

### Backend

El servidor está desarrollado con Node.js, Express y Prisma ORM para la gestión de la base de datos.

- **Componentes principales**:
  - Controladores: Lógica de negocio
  - Rutas: Endpoints de la API
  - Modelos: Definición de la estructura de datos
  - Middlewares: Funciones intermediarias para autenticación y validación

## Base de Datos

El sistema utiliza SQLite como base de datos con los siguientes modelos principales:

- **User**: Usuarios del sistema
- **Personal**: Personal médico y administrativo
- **Medicamento**: Inventario de medicamentos
- **Paciente**: Registro de pacientes
- **Entrega**: Registro de entregas de medicamentos
- **EntregaDetalle**: Detalles de cada entrega

## Instalación

### Requisitos previos
- Node.js (v14 o superior)
- npm o yarn

### Pasos para instalar

1. Clonar el repositorio
2. Instalar dependencias del backend:
   ```
   cd backend
   npm install
   ```
3. Configurar la base de datos:
   ```
   npx prisma migrate dev
   ```
4. Instalar dependencias del frontend:
   ```
   cd ../frontend
   npm install
   ```

## Ejecución

1. Iniciar el backend:
   ```
   cd backend
   npm run dev
   ```
2. Iniciar el frontend:
   ```
   cd frontend
   npm run dev
   ```
   o
   
## Ejecución con la base de datos del servidor y el proyecto en local:

   Conectar el tunel ssh:
   ```
   ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -L 3306:127.0.0.1:3306 usuario@ip-del-servidor
   ```
   Iniciar el backend:
   ```
   cd backend
   npm run start:cloud
   ```
   Iniciar el frontend:
   ```
   cd frontend
   npm run dev
   ```

## Aplicación Web Progresiva (PWA)

El sistema está disponible como una Aplicación Web Progresiva (PWA), lo que permite:

- Instalación en dispositivos móviles y de escritorio
- Funcionamiento offline
- Actualizaciones automáticas
- Experiencia similar a una aplicación nativa

const { createTunnel } = require('tunnel-ssh');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({
  path: process.env.NODE_ENV_DB_PATH || '.env'
});

// Validar configuración SSH
if (!process.env.SSH_HOST || process.env.SSH_HOST === 'your-ssh-host.com') {
  console.error('ERROR: SSH_HOST no está configurado correctamente en el archivo .env');
  console.error('Por favor, configure SSH_HOST con el nombre de host del servidor SSH correcto');
  // No cerramos el proceso aquí para permitir que la aplicación continúe en modo de desarrollo
}

// Configuración del túnel SSH
const tunnelConfig = {
  username: process.env.SSH_USERNAME, // Nombre de usuario SSH desde .env
  password: process.env.SSH_PASSWORD, // Contraseña SSH desde .env
  privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH ? path.normalize(process.env.SSH_PRIVATE_KEY_PATH) : null, // Ruta normalizada de la clave privada SSH
  passphrase: process.env.SSH_PASSPHRASE, // Frase de contraseña de la clave privada SSH desde .env
  host: process.env.SSH_HOST, // Nombre del host del servidor SSH desde .env
  port: parseInt(process.env.SSH_PORT) || 22, // Puerto del servidor SSH desde .env
  dstHost: '127.0.0.1', // Host de la base de datos desde la perspectiva del servidor SSH
  dstPort: 3306, // Puerto de la base de datos
  localHost: '127.0.0.1', // Host local al que conectarse
  localPort: 3306, // Puerto local al que conectarse
  keepAlive: true // Mantener el túnel activo
};

// Implementación del patrón Singleton para el túnel SSH
class SshTunnelManager {
  constructor() {
    this.server = null;
    this.sshConnection = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // 2 segundos de retraso inicial
  }

  // Obtener la instancia actual del túnel o crear una nueva si no existe
  async getTunnel() {
    if (this.server) {
      return this.server;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    return this.connect();
  }

  // Conectar al túnel SSH
  async connect() {
    if (this.isConnecting) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        console.log(`Intentando establecer túnel SSH a ${tunnelConfig.host}:${tunnelConfig.port}`);
        console.log(`Redirigiendo a ${tunnelConfig.dstHost}:${tunnelConfig.dstPort}`);
        console.log(`Método de autenticación: ${tunnelConfig.privateKeyPath ? 'Clave Privada' : 'Contraseña'}`);

        // Verificar la configuración de la clave privada si se especifica
        if (tunnelConfig.privateKeyPath) {
          console.log('Intentando usar autenticación con clave privada');
          console.log('Ruta de la clave privada:', tunnelConfig.privateKeyPath);
          
          // Comprobar si el archivo de clave privada existe
          try {
            if (fs.existsSync(tunnelConfig.privateKeyPath)) {
              console.log('El archivo de clave privada existe');
              
              // Comprobar si el archivo es legible
              try {
                fs.accessSync(tunnelConfig.privateKeyPath, fs.constants.R_OK);
                console.log('El archivo de clave privada es legible');
              } catch (accessErr) {
                console.error('ERROR: El archivo de clave privada existe pero no es legible:', accessErr.message);
              }
            } else {
              console.error('ERROR: El archivo de clave privada no existe en la ruta:', tunnelConfig.privateKeyPath);
              console.error('Por favor, verifique la variable de entorno SSH_PRIVATE_KEY_PATH');
              console.error('Directorio de trabajo actual:', process.cwd());
            }
          } catch (checkErr) {
            console.error('ERROR: Excepción al verificar si existe el archivo de clave privada:', checkErr.message);
            console.error('Ruta de la clave privada:', tunnelConfig.privateKeyPath);
          }
        }

        // Reestructurar la configuración para createTunnel
        const tunnelOptions = {
          autoClose: false, // Cambiado a falso para evitar el cierre automático
          reconnectOnError: true
        };

        const serverOptions = {
          host: tunnelConfig.localHost,
          port: tunnelConfig.localPort
        };

        // Preparar opciones SSH
        const sshOptions = {
          host: tunnelConfig.host,
          port: tunnelConfig.port,
          username: tunnelConfig.username,
          keepaliveInterval: 30000, // Enviar paquetes keepalive cada 30 segundos
          keepaliveCountMax: 3 // Permitir 3 keepalives perdidos antes de considerar la conexión muerta
        };

        // Usar autenticación con clave privada si está configurada, de lo contrario usar contraseña
        if (tunnelConfig.privateKeyPath && fs.existsSync(tunnelConfig.privateKeyPath)) {
          try {
            // Leer archivo de clave privada con ruta normalizada
            const privateKey = fs.readFileSync(tunnelConfig.privateKeyPath, 'utf8');
            console.log('Archivo de clave privada leído correctamente');
            
            // Validación básica del formato de la clave privada
            if (privateKey.includes('PRIVATE KEY')) {
              console.log('La clave privada parece tener un formato válido');
            } else {
              console.warn('ADVERTENCIA: La clave privada puede no tener el formato esperado');
              console.warn('La clave privada debe contener el encabezado "PRIVATE KEY"');
            }
            
            // Añadir clave privada a las opciones SSH
            sshOptions.privateKey = privateKey;
            
            // Añadir frase de contraseña si se proporciona
            if (tunnelConfig.passphrase) {
              sshOptions.passphrase = tunnelConfig.passphrase;
              console.log('Usando clave privada con frase de contraseña');
            } else {
              console.log('Usando clave privada sin frase de contraseña');
            }
          } catch (readErr) {
            console.error('ERROR: No se pudo leer el archivo de clave privada:', readErr);
            console.error('Ruta de la clave privada:', tunnelConfig.privateKeyPath);
            console.error('Detalles del error:', readErr.message);
            console.error('Pila de errores:', readErr.stack);
            console.error('Recurriendo a la autenticación por contraseña si está disponible');
            
            // Recurrir a la autenticación por contraseña si está disponible
            if (tunnelConfig.password) {
              sshOptions.password = tunnelConfig.password;
              console.log('Recurriendo a la autenticación por contraseña');
            }
          }
        } else if (tunnelConfig.password) {
          // Usar autenticación por contraseña
          sshOptions.password = tunnelConfig.password;
          console.log('Usando autenticación por contraseña');
        } else {
          console.error('ERROR: No hay un método de autenticación válido disponible');
          console.error('Por favor, configure SSH_PASSWORD o SSH_PRIVATE_KEY_PATH');
          this.isConnecting = false;
          this.connectionPromise = null;
          return reject(new Error('No valid authentication method available'));
        }

        const forwardOptions = {
          srcAddr: tunnelConfig.localHost,
          srcPort: tunnelConfig.localPort,
          dstAddr: tunnelConfig.dstHost,
          dstPort: tunnelConfig.dstPort
        };

        // Crear el túnel usando la nueva API
        createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions)
          .then(([serverInstance, sshConnection]) => {
            // Almacenar la instancia del servidor y la conexión SSH
            this.server = serverInstance;
            this.sshConnection = sshConnection;
            this.reconnectAttempts = 0; // Reiniciar intentos de reconexión en conexión exitosa

            console.log('Túnel SSH conectado exitosamente');
            console.log('Base de datos ahora accesible en localhost:3306');

            // Manejar errores del túnel
            serverInstance.on('error', (error) => {
              console.error('Error en el túnel SSH:', error);
              console.error('Las conexiones a la base de datos pueden fallar hasta que se restaure el túnel');
              this.handleDisconnection('error');
            });

            // Manejar cierre del túnel
            serverInstance.on('close', () => {
              console.log('Túnel SSH cerrado');
              this.handleDisconnection('close');
            });

            // Manejar errores de conexión SSH
            sshConnection.on('error', (error) => {
              console.error('Error de conexión SSH:', error);
              this.handleDisconnection('ssh-error');
            });

            // Resolver la promesa con la instancia del servidor
            this.isConnecting = false;
            resolve(serverInstance);
          })
          .catch(error => {
            console.error('Error de conexión del túnel SSH:', error);
            console.error('Las conexiones a la base de datos pueden fallar. Verifique su configuración SSH.');
            this.isConnecting = false;
            this.connectionPromise = null;
            this.handleDisconnection('connection-error');
            reject(error);
          });
      } catch (error) {
        console.error('Error al crear el túnel SSH:', error);
        console.error('Las conexiones a la base de datos fallarán. Verifique su configuración SSH.');
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Manejar desconexión e intentar reconectar
  handleDisconnection(reason) {
    console.log(`Túnel SSH desconectado (razón: ${reason}). Intentando reconectar...`);
    
    // Limpiar las referencias actuales del servidor y la conexión
    this.server = null;
    this.sshConnection = null;
    this.connectionPromise = null;
    
    // Intentar reconectar con retroceso exponencial
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      this.reconnectAttempts++;
      
      console.log(`Reconectando en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error(`Intento de reconexión ${this.reconnectAttempts} fallido:`, error);
        });
      }, delay);
    } else {
      console.error(`Número máximo de intentos de reconexión (${this.maxReconnectAttempts}) alcanzado. Abandonando.`);
      console.error('Las conexiones a la base de datos fallarán hasta que se reinicie la aplicación.');
    }
  }

  // Cerrar el túnel explícitamente
  close() {
    if (this.server && typeof this.server.close === 'function') {
      console.log('Cerrando explícitamente el túnel SSH...');
      this.server.close();
      this.server = null;
      this.sshConnection = null;
      this.connectionPromise = null;
    }
  }
}

// Crear una instancia singleton
const tunnelManager = new SshTunnelManager();

// Crear una promesa que se resuelve cuando se establece el túnel SSH
const tunnelPromise = tunnelManager.connect();

// Exportar el gestor del túnel y la promesa
module.exports = {
  tunnelPromise,
  getTunnel: () => tunnelManager.getTunnel(),
  close: () => tunnelManager.close()
};

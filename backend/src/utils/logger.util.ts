/**
 * logger.util.ts
 * Utilidad para registro estructurado y colorido con marcas de tiempo y niveles de registro
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

// Códigos de color ANSI para la salida del terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

// Mapear niveles de registro a colores
const levelColors = {
  [LogLevel.DEBUG]: colors.cyan,
  [LogLevel.INFO]: colors.blue,
  [LogLevel.WARN]: colors.yellow,
  [LogLevel.ERROR]: colors.red,
  [LogLevel.SUCCESS]: colors.green,
};

// Formatear la marca de tiempo como YYYY-MM-DD HH:MM:SS
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

// Formatear el mensaje de registro con marca de tiempo, nivel y contexto
const formatLogMessage = (level: LogLevel, context: string, message: string): string => {
  const timestamp = getTimestamp();
  const color = levelColors[level];
  
  return `${colors.dim}[${timestamp}]${colors.reset} ${color}${colors.bright}[${level}]${colors.reset} ${colors.magenta}[${context}]${colors.reset} ${message}`;
};

// Registrar un objeto con formato adecuado
const logObject = (obj: any): void => {
  if (typeof obj === 'object' && obj !== null) {
    console.log(JSON.stringify(obj, null, 2));
  } else {
    console.log(obj);
  }
};

// Clase principal del registrador
export class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  debug(message: string, ...args: any[]): void {
    console.log(formatLogMessage(LogLevel.DEBUG, this.context, message));
    args.forEach(arg => logObject(arg));
  }

  info(message: string, ...args: any[]): void {
    console.log(formatLogMessage(LogLevel.INFO, this.context, message));
    args.forEach(arg => logObject(arg));
  }

  warn(message: string, ...args: any[]): void {
    console.log(formatLogMessage(LogLevel.WARN, this.context, message));
    args.forEach(arg => logObject(arg));
  }

  error(message: string, ...args: any[]): void {
    console.log(formatLogMessage(LogLevel.ERROR, this.context, message));
    args.forEach(arg => logObject(arg));
  }

  success(message: string, ...args: any[]): void {
    console.log(formatLogMessage(LogLevel.SUCCESS, this.context, message));
    args.forEach(arg => logObject(arg));
  }

  // Crear un nuevo registrador con un contexto diferente
  withContext(context: string): Logger {
    return new Logger(context);
  }
}

// Crear una instancia predeterminada del registrador
export const logger = new Logger();

// Exportar una función para crear un registrador con un contexto específico
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};
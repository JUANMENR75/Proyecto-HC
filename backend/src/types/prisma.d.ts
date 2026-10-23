import { PrismaClient } from '@prisma/client';

// Definir la interfaz del modelo Donación
export interface Donacion {
  id: number;
  nombre: string;
  cantidad: number;
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Extender PrismaClient para incluir la propiedad donación
declare global {
  namespace PrismaClient {
    interface PrismaClient {
      donacion: {
        findMany: (args?: any) => Promise<Donacion[]>;
        findUnique: (args: { where: { id: number } }) => Promise<Donacion | null>;
        create: (args: { data: any }) => Promise<Donacion>;
        update: (args: { where: { id: number }, data: any }) => Promise<Donacion>;
        delete: (args: { where: { id: number } }) => Promise<Donacion>;
        count: (args?: any) => Promise<number>;
      };
    }
  }
}

// Aumentar el módulo @prisma/client
declare module '@prisma/client' {
  export interface PrismaClient {
    donacion: {
      findMany: (args?: any) => Promise<Donacion[]>;
      findUnique: (args: { where: { id: number } }) => Promise<Donacion | null>;
      create: (args: { data: any }) => Promise<Donacion>;
      update: (args: { where: { id: number }, data: any }) => Promise<Donacion>;
      delete: (args: { where: { id: number } }) => Promise<Donacion>;
      count: (args?: any) => Promise<number>;
    };
  }
  
  export { Donacion };
}
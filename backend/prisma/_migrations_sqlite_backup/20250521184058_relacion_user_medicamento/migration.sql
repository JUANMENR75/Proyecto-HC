/*
  Warnings:

  - You are about to drop the column `medicamento` on the `Entrega` table. All the data in the column will be lost.
  - You are about to drop the column `medicamento` on the `RecetaDetalle` table. All the data in the column will be lost.
  - Added the required column `medicamentoId` to the `Entrega` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medicamentoId` to the `RecetaDetalle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Receta" ADD COLUMN "firmaMedico" TEXT;
ALTER TABLE "Receta" ADD COLUMN "selloHospital" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Doctor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER,
    CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Doctor" ("createdAt", "especialidad", "id", "nombre", "updatedAt") SELECT "createdAt", "especialidad", "id", "nombre", "updatedAt" FROM "Doctor";
DROP TABLE "Doctor";
ALTER TABLE "new_Doctor" RENAME TO "Doctor";
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");
CREATE TABLE "new_Entrega" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clave" TEXT NOT NULL,
    "medicamentoId" INTEGER NOT NULL,
    "general" INTEGER NOT NULL DEFAULT 0,
    "dental" INTEGER NOT NULL DEFAULT 0,
    "vales" INTEGER NOT NULL DEFAULT 0,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "personalId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entrega_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entrega_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entrega_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entrega_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "Personal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Entrega" ("clave", "createdAt", "dental", "doctorId", "fecha", "general", "id", "pacienteId", "personalId", "updatedAt", "vales") SELECT "clave", "createdAt", "dental", "doctorId", "fecha", "general", "id", "pacienteId", "personalId", "updatedAt", "vales" FROM "Entrega";
DROP TABLE "Entrega";
ALTER TABLE "new_Entrega" RENAME TO "Entrega";
CREATE UNIQUE INDEX "Entrega_clave_key" ON "Entrega"("clave");
CREATE TABLE "new_Personal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER,
    CONSTRAINT "Personal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Personal" ("createdAt", "id", "nombre", "puesto", "updatedAt") SELECT "createdAt", "id", "nombre", "puesto", "updatedAt" FROM "Personal";
DROP TABLE "Personal";
ALTER TABLE "new_Personal" RENAME TO "Personal";
CREATE UNIQUE INDEX "Personal_userId_key" ON "Personal"("userId");
CREATE TABLE "new_RecetaDetalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recetaId" INTEGER NOT NULL,
    "medicamentoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecetaDetalle_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecetaDetalle_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RecetaDetalle" ("cantidad", "createdAt", "id", "recetaId", "updatedAt") SELECT "cantidad", "createdAt", "id", "recetaId", "updatedAt" FROM "RecetaDetalle";
DROP TABLE "RecetaDetalle";
ALTER TABLE "new_RecetaDetalle" RENAME TO "RecetaDetalle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

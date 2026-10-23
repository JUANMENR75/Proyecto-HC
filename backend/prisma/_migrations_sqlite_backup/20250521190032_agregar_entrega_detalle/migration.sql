/*
  Warnings:

  - You are about to drop the column `medicamentoId` on the `Entrega` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "EntregaDetalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entregaId" INTEGER NOT NULL,
    "medicamentoId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EntregaDetalle_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "Entrega" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EntregaDetalle_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Entrega" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clave" TEXT NOT NULL,
    "general" INTEGER NOT NULL DEFAULT 0,
    "dental" INTEGER NOT NULL DEFAULT 0,
    "vales" INTEGER NOT NULL DEFAULT 0,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "personalId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entrega_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entrega_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entrega_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "Personal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Entrega" ("clave", "createdAt", "dental", "doctorId", "fecha", "general", "id", "pacienteId", "personalId", "updatedAt", "vales") SELECT "clave", "createdAt", "dental", "doctorId", "fecha", "general", "id", "pacienteId", "personalId", "updatedAt", "vales" FROM "Entrega";
DROP TABLE "Entrega";
ALTER TABLE "new_Entrega" RENAME TO "Entrega";
CREATE UNIQUE INDEX "Entrega_clave_key" ON "Entrega"("clave");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

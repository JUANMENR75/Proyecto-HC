-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Receta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigoQR" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" INTEGER NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "firmaMedico" TEXT,
    "selloHospital" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT "Receta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Receta_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Receta" ("codigoQR", "createdAt", "doctorId", "fecha", "firmaMedico", "id", "pacienteId", "selloHospital", "updatedAt") SELECT "codigoQR", "createdAt", "doctorId", "fecha", "firmaMedico", "id", "pacienteId", "selloHospital", "updatedAt" FROM "Receta";
DROP TABLE "Receta";
ALTER TABLE "new_Receta" RENAME TO "Receta";
CREATE UNIQUE INDEX "Receta_codigoQR_key" ON "Receta"("codigoQR");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

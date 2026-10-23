/*
  Warnings:

  - You are about to drop the `receta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `recetadetalle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `receta` DROP FOREIGN KEY `Receta_doctorId_fkey`;

-- DropForeignKey
ALTER TABLE `receta` DROP FOREIGN KEY `Receta_pacienteId_fkey`;

-- DropForeignKey
ALTER TABLE `recetadetalle` DROP FOREIGN KEY `RecetaDetalle_medicamentoId_fkey`;

-- DropForeignKey
ALTER TABLE `recetadetalle` DROP FOREIGN KEY `RecetaDetalle_recetaId_fkey`;

-- DropTable
DROP TABLE `receta`;

-- DropTable
DROP TABLE `recetadetalle`;

-- CreateTable
CREATE TABLE `Donacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

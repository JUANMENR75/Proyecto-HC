-- DropForeignKey
ALTER TABLE `personal` DROP FOREIGN KEY `Personal_userId_fkey`;

-- AddForeignKey
ALTER TABLE `Personal` ADD CONSTRAINT `Personal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

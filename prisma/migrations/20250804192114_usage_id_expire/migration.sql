/*
  Warnings:

  - You are about to drop the column `expireAt` on the `Usage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Usage" DROP COLUMN "expireAt",
ADD COLUMN     "expire" TIMESTAMP(3);

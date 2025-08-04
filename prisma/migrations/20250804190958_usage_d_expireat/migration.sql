/*
  Warnings:

  - You are about to drop the column `expire` on the `Usage` table. All the data in the column will be lost.
  - Added the required column `expireAt` to the `Usage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Usage" DROP COLUMN "expire",
ADD COLUMN     "expireAt" TIMESTAMP(3) NOT NULL;

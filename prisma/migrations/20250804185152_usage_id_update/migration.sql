/*
  Warnings:

  - Made the column `expire` on table `Usage` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Usage" ALTER COLUMN "expire" SET NOT NULL;

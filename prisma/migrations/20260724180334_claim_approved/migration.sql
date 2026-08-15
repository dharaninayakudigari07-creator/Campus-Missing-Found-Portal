/*
  Warnings:

  - You are about to drop the column `isReceived` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAt` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "isReceived",
DROP COLUMN "receivedAt",
ADD COLUMN     "claimApproved" BOOLEAN NOT NULL DEFAULT false;

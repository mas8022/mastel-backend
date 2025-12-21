/*
  Warnings:

  - A unique constraint covering the columns `[firstUserId,secondUserId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Contact_firstUserId_secondUserId_key" ON "Contact"("firstUserId", "secondUserId");

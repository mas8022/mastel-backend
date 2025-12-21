-- DropIndex
DROP INDEX "Contact_firstUserId_secondUserId_key";

-- CreateIndex
CREATE INDEX "Contact_firstUserId_secondUserId_idx" ON "Contact"("firstUserId", "secondUserId");

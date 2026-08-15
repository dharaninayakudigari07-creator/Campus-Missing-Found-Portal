-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_itemId_fkey";

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

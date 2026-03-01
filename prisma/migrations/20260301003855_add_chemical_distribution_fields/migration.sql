-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChemicalUsageRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chemicalBatchId" INTEGER NOT NULL,
    "usedById" INTEGER,
    "recipientId" INTEGER,
    "subjectId" INTEGER,
    "roomId" INTEGER,
    "quantityUsed" REAL NOT NULL,
    "quantityRequested" REAL NOT NULL,
    "unit" TEXT,
    "isDistribution" BOOLEAN NOT NULL DEFAULT false,
    "distributedUnit" TEXT,
    "distributedAmount" REAL,
    "purpose" TEXT,
    "dateUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" INTEGER NOT NULL,
    CONSTRAINT "ChemicalUsageRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_chemicalBatchId_fkey" FOREIGN KEY ("chemicalBatchId") REFERENCES "ChemicalBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChemicalUsageRecord" ("chemicalBatchId", "dateUsed", "id", "purpose", "quantityRequested", "quantityUsed", "recordedById", "roomId", "subjectId", "unit", "usedById") SELECT "chemicalBatchId", "dateUsed", "id", "purpose", "quantityRequested", "quantityUsed", "recordedById", "roomId", "subjectId", "unit", "usedById" FROM "ChemicalUsageRecord";
DROP TABLE "ChemicalUsageRecord";
ALTER TABLE "new_ChemicalUsageRecord" RENAME TO "ChemicalUsageRecord";
CREATE INDEX "ChemicalUsageRecord_chemicalBatchId_recipientId_dateUsed_idx" ON "ChemicalUsageRecord"("chemicalBatchId", "recipientId", "dateUsed");
CREATE INDEX "ChemicalUsageRecord_recipientId_isDistribution_idx" ON "ChemicalUsageRecord"("recipientId", "isDistribution");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

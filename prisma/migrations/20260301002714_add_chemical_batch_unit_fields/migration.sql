/*
  Warnings:

  - Added the required column `baseUnit` to the `ChemicalBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalUnit` to the `ChemicalBatch` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChemicalBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chemicalId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "originalVolume" REAL NOT NULL DEFAULT 0,
    "originalUnit" TEXT NOT NULL,
    "remainingVolume" REAL NOT NULL DEFAULT 0,
    "baseUnit" TEXT NOT NULL,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME,
    "expiryDate" DATETIME,
    "inventoryNumber" TEXT NOT NULL,
    "notes" TEXT,
    "addedById" INTEGER NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChemicalBatch_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChemicalBatch_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Backfill existing records with unit from Chemical table
-- Set originalUnit and baseUnit to the chemical's unit for existing batches
INSERT INTO "new_ChemicalBatch" ("addedAt", "addedById", "batchNumber", "chemicalId", "expiryDate", "id", "inventoryNumber", "notes", "originalVolume", "originalUnit", "purchaseDate", "remainingVolume", "baseUnit", "unitCost") 
SELECT cb."addedAt", cb."addedById", cb."batchNumber", cb."chemicalId", cb."expiryDate", cb."id", cb."inventoryNumber", cb."notes", cb."originalVolume", 
       COALESCE(c."unit", 'ML') as "originalUnit", 
       cb."purchaseDate", cb."remainingVolume", 
       COALESCE(c."unit", 'ML') as "baseUnit", 
       cb."unitCost" 
FROM "ChemicalBatch" cb
LEFT JOIN "Chemical" c ON cb."chemicalId" = c."id";
DROP TABLE "ChemicalBatch";
ALTER TABLE "new_ChemicalBatch" RENAME TO "ChemicalBatch";
CREATE UNIQUE INDEX "ChemicalBatch_inventoryNumber_key" ON "ChemicalBatch"("inventoryNumber");
CREATE INDEX "ChemicalBatch_chemicalId_expiryDate_remainingVolume_idx" ON "ChemicalBatch"("chemicalId", "expiryDate", "remainingVolume");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

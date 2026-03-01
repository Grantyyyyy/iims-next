/*
  Warnings:

  - Added the required column `updatedAt` to the `Apparatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Chemical` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN "deletedAt" DATETIME;

-- CreateTable
CREATE TABLE "OldChemical" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "volume" REAL NOT NULL DEFAULT 0,
    "reorderLevel" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ApparatusBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apparatusId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "originalQty" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME,
    "notes" TEXT,
    "addedById" INTEGER NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApparatusBatch_apparatusId_fkey" FOREIGN KEY ("apparatusId") REFERENCES "Apparatus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApparatusBatch_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChemicalBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chemicalId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "originalVolume" REAL NOT NULL DEFAULT 0,
    "remainingVolume" REAL NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME,
    "expiryDate" DATETIME,
    "inventoryNumber" TEXT NOT NULL,
    "notes" TEXT,
    "addedById" INTEGER NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChemicalBatch_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChemicalBatch_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChemicalUsageRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chemicalBatchId" INTEGER NOT NULL,
    "usedById" INTEGER,
    "subjectId" INTEGER,
    "roomId" INTEGER,
    "quantityUsed" REAL NOT NULL,
    "quantityRequested" REAL NOT NULL,
    "unit" TEXT,
    "purpose" TEXT,
    "dateUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" INTEGER NOT NULL,
    CONSTRAINT "ChemicalUsageRecord_chemicalBatchId_fkey" FOREIGN KEY ("chemicalBatchId") REFERENCES "ChemicalBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsageRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabBorrowRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "equipmentInstanceId" INTEGER,
    "apparatusInstanceId" INTEGER,
    "borrowerId" INTEGER,
    "studentName" TEXT,
    "studentCourse" TEXT,
    "studentYearLevel" TEXT,
    "roomId" INTEGER,
    "purpose" TEXT,
    "borrowDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "returnDate" DATETIME,
    "previousBorrowerId" INTEGER,
    CONSTRAINT "LabBorrowRecord_equipmentInstanceId_fkey" FOREIGN KEY ("equipmentInstanceId") REFERENCES "EquipmentInstance" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LabBorrowRecord_apparatusInstanceId_fkey" FOREIGN KEY ("apparatusInstanceId") REFERENCES "ApparatusInstance" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LabBorrowRecord_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LabBorrowRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LabBorrowRecord_previousBorrowerId_fkey" FOREIGN KEY ("previousBorrowerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabReturnRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "labBorrowRecordId" INTEGER NOT NULL,
    "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conditionOnReturn" TEXT,
    "notes" TEXT,
    CONSTRAINT "LabReturnRecord_labBorrowRecordId_fkey" FOREIGN KEY ("labBorrowRecordId") REFERENCES "LabBorrowRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Apparatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "apparatusType" TEXT NOT NULL DEFAULT 'Non-Consumables',
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" INTEGER,
    CONSTRAINT "Apparatus_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LabCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Apparatus" ("apparatusType", "categoryId", "description", "id", "name", "quantity") SELECT "apparatusType", "categoryId", "description", "id", "name", "quantity" FROM "Apparatus";
DROP TABLE "Apparatus";
ALTER TABLE "new_Apparatus" RENAME TO "Apparatus";
CREATE TABLE "new_ApparatusInstance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serialNumber" TEXT,
    "inventoryNumber" TEXT NOT NULL,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "currentCondition" TEXT DEFAULT 'Good',
    "lastCondition" TEXT,
    "barcodeUrl" TEXT,
    "purchaseDate" DATETIME,
    "usefulLife" INTEGER,
    "deletedAt" DATETIME,
    "apparatusId" INTEGER NOT NULL,
    CONSTRAINT "ApparatusInstance_apparatusId_fkey" FOREIGN KEY ("apparatusId") REFERENCES "Apparatus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ApparatusInstance" ("apparatusId", "barcodeUrl", "currentCondition", "id", "inventoryNumber", "lastCondition", "purchaseDate", "quantity", "serialNumber", "unitCost", "usefulLife") SELECT "apparatusId", "barcodeUrl", "currentCondition", "id", "inventoryNumber", "lastCondition", "purchaseDate", "quantity", "serialNumber", "unitCost", "usefulLife" FROM "ApparatusInstance";
DROP TABLE "ApparatusInstance";
ALTER TABLE "new_ApparatusInstance" RENAME TO "ApparatusInstance";
CREATE UNIQUE INDEX "ApparatusInstance_serialNumber_key" ON "ApparatusInstance"("serialNumber");
CREATE UNIQUE INDEX "ApparatusInstance_inventoryNumber_key" ON "ApparatusInstance"("inventoryNumber");
CREATE TABLE "new_Chemical" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "volume" REAL NOT NULL DEFAULT 0,
    "reorderLevel" REAL NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Chemical" ("description", "id", "name", "reorderLevel", "unit", "volume") SELECT "description", "id", "name", "reorderLevel", "unit", "volume" FROM "Chemical";
DROP TABLE "Chemical";
ALTER TABLE "new_Chemical" RENAME TO "Chemical";
CREATE UNIQUE INDEX "Chemical_name_key" ON "Chemical"("name");
CREATE TABLE "new_ChemicalStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" REAL NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME,
    "inventoryNumber" TEXT NOT NULL,
    "volume" REAL NOT NULL DEFAULT 0,
    "expiryDate" DATETIME,
    "barcodeUrl" TEXT,
    "chemicalId" INTEGER NOT NULL,
    CONSTRAINT "ChemicalStock_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "OldChemical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ChemicalStock" ("barcodeUrl", "chemicalId", "expiryDate", "id", "inventoryNumber", "price", "purchaseDate", "volume") SELECT "barcodeUrl", "chemicalId", "expiryDate", "id", "inventoryNumber", "price", "purchaseDate", "volume" FROM "ChemicalStock";
DROP TABLE "ChemicalStock";
ALTER TABLE "new_ChemicalStock" RENAME TO "ChemicalStock";
CREATE UNIQUE INDEX "ChemicalStock_inventoryNumber_key" ON "ChemicalStock"("inventoryNumber");
CREATE TABLE "new_EquipmentInstance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "inventoryNumber" TEXT NOT NULL,
    "usefulLife" INTEGER,
    "purchaseDate" DATETIME,
    "serialNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Inactive',
    "currentCondition" TEXT DEFAULT 'Good',
    "lastCondition" TEXT,
    "barcodeUrl" TEXT,
    "deletedAt" DATETIME,
    "equipmentId" INTEGER NOT NULL,
    CONSTRAINT "EquipmentInstance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EquipmentInstance" ("barcodeUrl", "currentCondition", "equipmentId", "id", "inventoryNumber", "lastCondition", "purchaseDate", "quantity", "serialNumber", "status", "unitCost", "usefulLife") SELECT "barcodeUrl", "currentCondition", "equipmentId", "id", "inventoryNumber", "lastCondition", "purchaseDate", "quantity", "serialNumber", "status", "unitCost", "usefulLife" FROM "EquipmentInstance";
DROP TABLE "EquipmentInstance";
ALTER TABLE "new_EquipmentInstance" RENAME TO "EquipmentInstance";
CREATE UNIQUE INDEX "EquipmentInstance_inventoryNumber_key" ON "EquipmentInstance"("inventoryNumber");
CREATE UNIQUE INDEX "EquipmentInstance_serialNumber_key" ON "EquipmentInstance"("serialNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ChemicalBatch_inventoryNumber_key" ON "ChemicalBatch"("inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LabReturnRecord_labBorrowRecordId_key" ON "LabReturnRecord"("labBorrowRecordId");

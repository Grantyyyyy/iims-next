-- CreateTable
CREATE TABLE "Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Room" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    CONSTRAINT "Room_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "contactNumber" TEXT,
    "customId" INTEGER,
    "barcodeValue" TEXT,
    "barcodeImageUrl" TEXT,
    "profilePicUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "departmentId" INTEGER,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT
);

-- CreateTable
CREATE TABLE "Item" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "model" TEXT,
    "itemType" TEXT NOT NULL DEFAULT 'Non-Consumables',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" INTEGER,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemInstance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME,
    "serialNumber" TEXT,
    "inventoryNumber" TEXT,
    "currentCondition" TEXT DEFAULT 'Good',
    "lastCondition" TEXT,
    "barcodeUrl" TEXT,
    "usefulLife" INTEGER,
    "itemId" INTEGER NOT NULL,
    CONSTRAINT "ItemInstance_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BorrowRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "customBorrower" TEXT,
    "borrowDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "returnDate" DATETIME,
    "purpose" TEXT,
    "itemInstanceId" INTEGER NOT NULL,
    "borrowerId" INTEGER,
    "roomId" INTEGER,
    "previousUserId" INTEGER,
    CONSTRAINT "BorrowRecord_previousUserId_fkey" FOREIGN KEY ("previousUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BorrowRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BorrowRecord_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BorrowRecord_itemInstanceId_fkey" FOREIGN KEY ("itemInstanceId") REFERENCES "ItemInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReturnRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "returnDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conditionOnReturn" TEXT,
    "notes" TEXT,
    "borrowRecordId" INTEGER NOT NULL,
    "itemInstanceId" INTEGER NOT NULL,
    CONSTRAINT "ReturnRecord_borrowRecordId_fkey" FOREIGN KEY ("borrowRecordId") REFERENCES "BorrowRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DistributionRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemInstanceId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "distributedById" INTEGER NOT NULL,
    "roomId" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purpose" TEXT,
    "distributedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchId" INTEGER,
    CONSTRAINT "DistributionRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DistributionRecord_distributedById_fkey" FOREIGN KEY ("distributedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DistributionRecord_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DistributionRecord_itemInstanceId_fkey" FOREIGN KEY ("itemInstanceId") REFERENCES "ItemInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DistributionRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ConsumableBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConsumableBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "itemInstanceId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "originalQty" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME,
    "notes" TEXT,
    "addedById" INTEGER NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsumableBatch_itemInstanceId_fkey" FOREIGN KEY ("itemInstanceId") REFERENCES "ItemInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConsumableBatch_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "LabCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" INTEGER,
    CONSTRAINT "Equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LabCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentInstance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "inventoryNumber" TEXT NOT NULL,
    "usefulLife" INTEGER NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME,
    "serialNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Inactive',
    "currentCondition" TEXT DEFAULT 'Good',
    "lastCondition" TEXT,
    "barcodeUrl" TEXT,
    "equipmentId" INTEGER NOT NULL,
    CONSTRAINT "EquipmentInstance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentAssignmentRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "inventoryNumber" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "assignedDate" DATETIME,
    "unassignedDate" DATETIME,
    "equipmentInstanceId" INTEGER NOT NULL,
    "assigneeId" INTEGER,
    "assignedLocationId" INTEGER,
    CONSTRAINT "EquipmentAssignmentRecord_assignedLocationId_fkey" FOREIGN KEY ("assignedLocationId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipmentAssignmentRecord_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipmentAssignmentRecord_equipmentInstanceId_fkey" FOREIGN KEY ("equipmentInstanceId") REFERENCES "EquipmentInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentBorrowRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "customBorrower" TEXT,
    "borrowedDate" DATETIME,
    "returnedDate" DATETIME,
    "purpose" TEXT,
    "equipmentInstanceId" INTEGER NOT NULL,
    "borrowerId" INTEGER,
    "subjectId" INTEGER,
    "roomId" INTEGER,
    CONSTRAINT "EquipmentBorrowRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipmentBorrowRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipmentBorrowRecord_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EquipmentBorrowRecord_equipmentInstanceId_fkey" FOREIGN KEY ("equipmentInstanceId") REFERENCES "EquipmentInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquipmentReturnRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "returnedDate" DATETIME,
    "remarks" TEXT,
    "equipmentInstanceId" INTEGER NOT NULL,
    "borrowRecordId" INTEGER NOT NULL,
    CONSTRAINT "EquipmentReturnRecord_borrowRecordId_fkey" FOREIGN KEY ("borrowRecordId") REFERENCES "EquipmentBorrowRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EquipmentReturnRecord_equipmentInstanceId_fkey" FOREIGN KEY ("equipmentInstanceId") REFERENCES "EquipmentInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Apparatus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "apparatusType" TEXT NOT NULL DEFAULT 'Non-Consumables',
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "categoryId" INTEGER,
    CONSTRAINT "Apparatus_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LabCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApparatusInstance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "serialNumber" TEXT,
    "inventoryNumber" TEXT NOT NULL,
    "unitCost" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "currentCondition" TEXT DEFAULT 'Good',
    "lastCondition" TEXT,
    "barcodeUrl" TEXT,
    "purchaseDate" DATETIME,
    "usefulLife" INTEGER NOT NULL DEFAULT 0,
    "apparatusId" INTEGER NOT NULL,
    CONSTRAINT "ApparatusInstance_apparatusId_fkey" FOREIGN KEY ("apparatusId") REFERENCES "Apparatus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApparatusBorrowRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "customBorrower" TEXT,
    "borrowedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedDate" DATETIME,
    "purpose" TEXT,
    "apparatusInstanceId" INTEGER NOT NULL,
    "borrowerId" INTEGER NOT NULL,
    "roomId" INTEGER,
    "subjectId" INTEGER,
    CONSTRAINT "ApparatusBorrowRecord_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ApparatusBorrowRecord_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ApparatusBorrowRecord_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApparatusBorrowRecord_apparatusInstanceId_fkey" FOREIGN KEY ("apparatusInstanceId") REFERENCES "ApparatusInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApparatusReturnRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "returnedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "apparatusInstanceId" INTEGER NOT NULL,
    "borrowRecordId" INTEGER NOT NULL,
    CONSTRAINT "ApparatusReturnRecord_borrowRecordId_fkey" FOREIGN KEY ("borrowRecordId") REFERENCES "ApparatusBorrowRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApparatusReturnRecord_apparatusInstanceId_fkey" FOREIGN KEY ("apparatusInstanceId") REFERENCES "ApparatusInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chemical" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "description" TEXT,
    "volume" REAL NOT NULL DEFAULT 0,
    "reorderLevel" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "ChemicalStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "price" REAL NOT NULL DEFAULT 0,
    "purchaseDate" DATETIME,
    "inventoryNumber" TEXT NOT NULL,
    "volume" REAL NOT NULL DEFAULT 0,
    "expiryDate" DATETIME,
    "barcodeUrl" TEXT,
    "chemicalId" INTEGER NOT NULL,
    CONSTRAINT "ChemicalStock_chemicalId_fkey" FOREIGN KEY ("chemicalId") REFERENCES "Chemical" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChemicalUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantityUsed" REAL NOT NULL DEFAULT 0,
    "quantityRequested" REAL,
    "requestUnit" TEXT,
    "purpose" TEXT,
    "dateUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedChemicalId" INTEGER NOT NULL,
    "borrowerId" INTEGER NOT NULL,
    "subjectId" INTEGER,
    "roomId" INTEGER,
    CONSTRAINT "ChemicalUsage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsage_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsage_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChemicalUsage_requestedChemicalId_fkey" FOREIGN KEY ("requestedChemicalId") REFERENCES "ChemicalStock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChemicalAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignedVolume" REAL NOT NULL,
    "remainingVolume" REAL NOT NULL,
    "processedDate" DATETIME,
    "assigneeId" INTEGER NOT NULL,
    "roomId" INTEGER,
    "chemicalStockId" INTEGER NOT NULL,
    "processedById" INTEGER,
    CONSTRAINT "ChemicalAssignment_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalAssignment_chemicalStockId_fkey" FOREIGN KEY ("chemicalStockId") REFERENCES "ChemicalStock" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChemicalAssignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ChemicalAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferReason" TEXT,
    "processedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "itemInstanceId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "newAssigneeId" INTEGER NOT NULL,
    "newLocationId" INTEGER NOT NULL,
    "processedById" INTEGER,
    CONSTRAINT "TransferRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TransferRequest_newLocationId_fkey" FOREIGN KEY ("newLocationId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransferRequest_newAssigneeId_fkey" FOREIGN KEY ("newAssigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransferRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransferRequest_itemInstanceId_fkey" FOREIGN KEY ("itemInstanceId") REFERENCES "ItemInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReplaceRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replacementReason" TEXT,
    "processedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "itemInstanceId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "replacementItemId" INTEGER,
    "processedById" INTEGER,
    CONSTRAINT "ReplaceRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReplaceRequest_replacementItemId_fkey" FOREIGN KEY ("replacementItemId") REFERENCES "ItemInstance" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReplaceRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReplaceRequest_itemInstanceId_fkey" FOREIGN KEY ("itemInstanceId") REFERENCES "ItemInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DisposeRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disposalReason" TEXT,
    "processedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "itemInstanceId" INTEGER NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "processedById" INTEGER,
    CONSTRAINT "DisposeRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DisposeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DisposeRequest_itemInstanceId_fkey" FOREIGN KEY ("itemInstanceId") REFERENCES "ItemInstance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_customId_key" ON "User"("customId");

-- CreateIndex
CREATE UNIQUE INDEX "User_barcodeValue_key" ON "User"("barcodeValue");

-- CreateIndex
CREATE UNIQUE INDEX "ItemInstance_serialNumber_key" ON "ItemInstance"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ItemInstance_inventoryNumber_key" ON "ItemInstance"("inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRecord_borrowRecordId_key" ON "ReturnRecord"("borrowRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentInstance_inventoryNumber_key" ON "EquipmentInstance"("inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentInstance_serialNumber_key" ON "EquipmentInstance"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentAssignmentRecord_inventoryNumber_key" ON "EquipmentAssignmentRecord"("inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ApparatusInstance_serialNumber_key" ON "ApparatusInstance"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ApparatusInstance_inventoryNumber_key" ON "ApparatusInstance"("inventoryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ChemicalStock_inventoryNumber_key" ON "ChemicalStock"("inventoryNumber");

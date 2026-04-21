// Shared type definitions for LabBorrowClient refactoring

export type CartItem = {
  instanceId: number
  instanceType: 'EQUIPMENT' | 'APPARATUS'
  itemId: number
  itemName: string
  inventoryNumber: string
}

export type BorrowerType = 'STAFF' | 'STUDENT'

export type StaffUser = {
  id: number
  customId: string
  firstName: string
  lastName: string
  profilePicUrl?: string | null
  departmentId: number
  department: {
    id: number
    name: string
  }
}

export type Room = {
  id: number
  name: string
  location: string
  department: {
    id: number
    name: string
  }
}

export type EquipmentItem = {
  id: number
  name: string
  model?: string | null
  category: {
    id: number
    name: string
  } | null
  instances: EquipmentInstance[]
}

export type ApparatusItem = {
  id: number
  name: string
  category: {
    id: number
    name: string
  } | null
  instances: ApparatusInstance[]
}

export type EquipmentInstance = {
  id: number
  inventoryNumber: string
  serialNumber?: string | null
  currentCondition: string | null
}

export type ApparatusInstance = {
  id: number
  inventoryNumber: string
  serialNumber?: string | null
  currentCondition: string | null
}

export type ConflictWarning = {
  itemName: string
  inventoryNumber: string
  date: Date
}

export type CheckoutStep = 1 | 2 | 3

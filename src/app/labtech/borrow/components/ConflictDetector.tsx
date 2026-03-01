'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getStaffActiveLabBorrows } from '../actions'
import type { BorrowerType, StaffUser, CartItem, ConflictWarning } from '../types'

type ConflictDetectorProps = {
  borrowerType: BorrowerType
  selectedBorrower: StaffUser | null
  cart: CartItem[]
  onConflictsDetected: (conflicts: ConflictWarning[]) => void
}

export default function ConflictDetector({
  borrowerType,
  selectedBorrower,
  cart,
  onConflictsDetected
}: ConflictDetectorProps) {
  const [conflicts, setConflicts] = useState<ConflictWarning[]>([])

  // Fetch active borrows and detect conflicts when STAFF borrower is selected
  useEffect(() => {
    // Skip conflict checks for STUDENT borrower type
    if (borrowerType !== 'STAFF' || !selectedBorrower) {
      // Clear conflicts asynchronously
      Promise.resolve().then(() => {
        setConflicts([])
        onConflictsDetected([])
      })
      return
    }

    // Fetch active borrows for the selected staff member
    const fetchAndDetectConflicts = async () => {
      try {
        const { borrows } = await getStaffActiveLabBorrows(selectedBorrower.id)
        
        // Compare cart items against active borrows by item ID
        const detectedConflicts: ConflictWarning[] = []
        
        for (const cartItem of cart) {
          for (const borrow of borrows) {
            let itemId: number | null = null
            let borrowDate: Date | null = null
            
            // Check equipment instances
            if (borrow.equipmentInstance && cartItem.instanceType === 'EQUIPMENT') {
              itemId = borrow.equipmentInstance.equipment.id
              borrowDate = borrow.borrowDate
            }
            
            // Check apparatus instances
            if (borrow.apparatusInstance && cartItem.instanceType === 'APPARATUS') {
              itemId = borrow.apparatusInstance.apparatus.id
              borrowDate = borrow.borrowDate
            }
            
            // If cart item's parent item ID matches an active borrow's item ID, it's a conflict
            if (itemId === cartItem.itemId && borrowDate) {
              detectedConflicts.push({
                itemName: cartItem.itemName,
                inventoryNumber: cartItem.inventoryNumber,
                date: borrowDate
              })
              break // Only add one conflict per cart item
            }
          }
        }
        
        setConflicts(detectedConflicts)
        onConflictsDetected(detectedConflicts)
      } catch (error) {
        console.error('Error fetching active borrows:', error)
        // On error, set empty conflicts and allow proceeding
        setConflicts([])
        onConflictsDetected([])
      }
    }

    fetchAndDetectConflicts()
  }, [borrowerType, selectedBorrower, cart, onConflictsDetected])

  // Don't render anything if no conflicts or not STAFF mode
  if (borrowerType !== 'STAFF' || conflicts.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Warning: This borrower already has related items
          </p>
          <div className="text-sm space-y-1 text-amber-900 dark:text-amber-200">
            {conflicts.map((conflict, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-500">•</span>
                <span>
                  <strong>{conflict.itemName}</strong> ({conflict.inventoryNumber}) - 
                  Borrowed on {new Date(conflict.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2 text-amber-700 dark:text-amber-300">
            You can still proceed with this borrow if needed.
          </p>
        </div>
      </div>
    </Card>
  )
}

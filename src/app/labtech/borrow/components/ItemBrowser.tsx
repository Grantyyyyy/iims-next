'use client'

import ItemGroup from './ItemGroup'
import type { EquipmentItem, ApparatusItem, EquipmentInstance, ApparatusInstance, CartItem } from '../types'

type ItemBrowserProps = {
  equipmentGroups: EquipmentItem[]
  apparatusGroups: ApparatusItem[]
  cart: CartItem[]
  expandedGroups: Record<string, boolean>
  onToggleGroup: (groupKey: string) => void
  onAddToCart: (instance: EquipmentInstance | ApparatusInstance, itemType: 'EQUIPMENT' | 'APPARATUS', item: EquipmentItem | ApparatusItem) => void
  scrollRef?: React.RefObject<HTMLDivElement | null>
}

export default function ItemBrowser({
  equipmentGroups,
  apparatusGroups,
  cart,
  expandedGroups,
  onToggleGroup,
  onAddToCart,
  scrollRef
}: ItemBrowserProps) {
  const equipmentCount = equipmentGroups.length
  const apparatusCount = apparatusGroups.length
  const totalCount = equipmentCount + apparatusCount

  // Show empty state when no items match filters
  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">No items match your search</p>
        <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters or search term</p>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="space-y-8">
      {/* Equipment Section */}
      {equipmentCount > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Equipment ({equipmentCount})
          </h3>
          <div className="space-y-3">
            {equipmentGroups.map((item) => {
              const groupKey = `equipment-${item.id}`
              return (
                <ItemGroup
                  key={groupKey}
                  item={item}
                  itemType="EQUIPMENT"
                  groupKey={groupKey}
                  isExpanded={expandedGroups[groupKey] || false}
                  cart={cart}
                  onToggle={() => onToggleGroup(groupKey)}
                  onAddToCart={(instance) => onAddToCart(instance, 'EQUIPMENT', item)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Apparatus Section */}
      {apparatusCount > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Apparatus ({apparatusCount})
          </h3>
          <div className="space-y-3">
            {apparatusGroups.map((item) => {
              const groupKey = `apparatus-${item.id}`
              return (
                <ItemGroup
                  key={groupKey}
                  item={item}
                  itemType="APPARATUS"
                  groupKey={groupKey}
                  isExpanded={expandedGroups[groupKey] || false}
                  cart={cart}
                  onToggle={() => onToggleGroup(groupKey)}
                  onAddToCart={(instance) => onAddToCart(instance, 'APPARATUS', item)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

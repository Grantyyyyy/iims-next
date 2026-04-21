'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react'
import type { EquipmentItem, ApparatusItem, EquipmentInstance, ApparatusInstance, CartItem } from '../types'

type ItemGroupProps = {
  item: EquipmentItem | ApparatusItem
  itemType: 'EQUIPMENT' | 'APPARATUS'
  groupKey: string
  isExpanded: boolean
  cart: CartItem[]
  onToggle: () => void
  onAddToCart: (instance: EquipmentInstance | ApparatusInstance) => void
}

export default function ItemGroup({
  item,
  itemType,
  groupKey: _groupKey,
  isExpanded,
  cart,
  onToggle,
  onAddToCart
}: ItemGroupProps) {
  const availableCount = item.instances.length
  const isEquipment = itemType === 'EQUIPMENT'
  const model = isEquipment && 'model' in item ? item.model : null

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggle}
      className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 bg-muted/10 hover:bg-primary/5 transition-all duration-300 cursor-pointer group/header relative overflow-hidden"
        onClick={onToggle}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-background border border-border/50 shadow-sm group-hover/header:border-primary/30 group-hover/header:shadow-md transition-all duration-300">
            {isExpanded ? <Minus className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h4 className="font-bold text-lg tracking-tight group-hover/header:text-primary transition-colors">{item.name}</h4>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/10">
                {item.category?.name}
              </span>
              {model && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="text-foreground/70">{model}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Badge
          variant={availableCount > 0 ? "default" : "secondary"}
          className={`h-7 px-4 rounded-lg font-bold transition-all duration-300 ${availableCount > 0 ? 'shadow-[0_0_10px_rgba(var(--primary),0.2)]' : ''}`}
        >
          {availableCount} in stock
        </Badge>
      </div>

      <CollapsibleContent className="bg-muted/5 backdrop-blur-sm divide-y border-t border-border/50">
        {item.instances.map((instance) => {
          const inCart = cart.some(c => c.instanceId === instance.id)

          return (
            <div key={instance.id} className="flex items-center justify-between p-4 pl-14 hover:bg-primary/5 transition-colors">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center flex-1 max-w-2xl text-sm">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Inventory #</span>
                  <span className="font-mono font-medium">{instance.inventoryNumber}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Serial #</span>
                  <span className="text-muted-foreground truncate max-w-[120px]">{instance.serialNumber || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Condition</span>
                  <Badge variant="outline" className="w-fit text-[10px] h-5 py-0">
                    {instance.currentCondition || 'Good'}
                  </Badge>
                </div>
              </div>

              <div className="shrink-0 ml-4">
                {inCart ? (
                  <Button variant="secondary" disabled size="sm" className="w-32 rounded-lg">
                    <Check className="h-3.5 w-3.5 mr-2" /> In Cart
                  </Button>
                ) : (
                  <Button onClick={() => onAddToCart(instance)} size="sm" className="w-32 rounded-lg font-semibold tracking-wide">
                    <ShoppingCart className="h-3.5 w-3.5 mr-2" /> Add to Cart
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}

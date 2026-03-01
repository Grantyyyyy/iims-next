'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type FloatingCartButtonProps = {
  itemCount: number
  onOpenCart: () => void
}

export default function FloatingCartButton({ itemCount, onOpenCart }: FloatingCartButtonProps) {
  const [isPulsing, setIsPulsing] = useState(false)

  // Trigger pulse animation when item count changes
  useEffect(() => {
    if (itemCount > 0) {
      // Use setTimeout to avoid synchronous setState in effect
      const pulseTimeout = setTimeout(() => setIsPulsing(true), 0)
      const resetTimeout = setTimeout(() => setIsPulsing(false), 300)
      return () => {
        clearTimeout(pulseTimeout)
        clearTimeout(resetTimeout)
      }
    }
  }, [itemCount])

  // Hide button when cart is empty
  if (itemCount === 0) {
    return null
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-transform ${isPulsing ? 'scale-110' : 'scale-100'}`}>
      <Button
        size="lg"
        className="rounded-full shadow-xl px-6 h-14 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 border-2 border-transparent"
        onClick={onOpenCart}
      >
        <ShoppingCart className="h-5 w-5 mr-3" />
        <span className="font-semibold text-base mr-3">Cart</span>
        <Badge variant="secondary" className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded-full w-6 h-6 p-0 flex items-center justify-center">
          {itemCount}
        </Badge>
      </Button>
    </div>
  )
}

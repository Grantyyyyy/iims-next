import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

type CategoryFilterProps = {
  categories: Array<{
    name: string
    count: number
    cartCount: number
  }>
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange
}: CategoryFilterProps) {
  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap rounded-md bg-background overflow-hidden pb-4">
        <div className="flex w-max space-x-2 px-1 py-2">
          {categories.map((cat) => (
            <Button
              key={cat.name}
              variant={activeCategory === cat.name ? "default" : "ghost"}
              className="rounded-full h-8 px-4 text-sm"
              onClick={() => onCategoryChange(cat.name)}
            >
              {cat.name}
              <span className="ml-2 text-xs opacity-70">({cat.count})</span>
              {cat.cartCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary-foreground text-primary"
                >
                  {cat.cartCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

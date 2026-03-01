'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { searchRooms } from '../actions'
import type { BorrowerType, StaffUser, Room } from '../types'

type RoomSelectorProps = {
  selectedRoom: Room | null
  borrowerType: BorrowerType
  selectedBorrower: StaffUser | null
  onRoomSelect: (room: Room | null) => void
}

export default function RoomSelector({
  selectedRoom,
  borrowerType,
  selectedBorrower,
  onRoomSelect
}: RoomSelectorProps) {
  const [roomSearch, setRoomSearch] = useState('')
  const [roomResults, setRoomResults] = useState<Room[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Determine if search should be disabled
  const isSearchDisabled = borrowerType === 'STAFF' && !selectedBorrower

  // Debounced room search (300ms delay)
  useEffect(() => {
    // Don't search if disabled
    if (isSearchDisabled) {
      setRoomResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      if (roomSearch.length >= 2 && !selectedRoom) {
        setIsSearching(true)
        try {
          // Filter by department when STAFF mode and staff is selected
          const departmentId = borrowerType === 'STAFF' && selectedBorrower
            ? selectedBorrower.departmentId
            : undefined

          const results = await searchRooms(roomSearch, departmentId)
          setRoomResults(results as unknown as Room[])
        } finally {
          setIsSearching(false)
        }
      } else {
        setRoomResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [roomSearch, selectedRoom, borrowerType, selectedBorrower, isSearchDisabled])

  return (
    <div className="space-y-2 relative">
      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Laboratory Room</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isSearchDisabled ? "Select a staff member first" : "Search laboratory rooms..."}
          className="pl-9 h-10 rounded-xl bg-muted/30 focus:bg-background transition-all text-sm"
          value={roomSearch}
          onChange={(e) => setRoomSearch(e.target.value)}
          disabled={isSearchDisabled || !!selectedRoom}
        />
        {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Display selected room details */}
      {selectedRoom && (
        <Card className="p-3 border-primary/20 bg-primary/5 flex items-center justify-between group transition-all duration-300 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none mb-1">{selectedRoom.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider opacity-70">{selectedRoom.location}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              onRoomSelect(null)
              setRoomSearch('')
            }}
          >
            Change
          </Button>
        </Card>
      )}

      {/* Room Search Results */}
      {!selectedRoom && roomSearch.length >= 2 && !isSearchDisabled && (
        <Card className="absolute top-full mt-2 w-full z-20 shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-primary/10 rounded-2xl divide-y overflow-hidden bg-background/95 backdrop-blur-md">
          {isSearching ? (
            <div className="p-10 text-sm text-center text-muted-foreground flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">Searching rooms...</span>
            </div>
          ) : roomResults.length > 0 ? (
            <div className="p-1.5">
              {roomResults.map(room => (
                <div
                  key={room.id}
                  className="flex items-start gap-3 p-3 hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all duration-200 group/item"
                  onClick={() => {
                    onRoomSelect(room)
                    setRoomSearch('')
                    setRoomResults([])
                  }}
                >
                  <div className="p-2 bg-muted rounded-lg group-hover/item:bg-primary/20 transition-colors">
                    <MapPin className="h-4 w-4 text-muted-foreground group-hover/item:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover/item:scale-[1.01] transition-transform">{room.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider opacity-70">
                      {room.location} {room.department ? `• ${room.department.name}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-sm text-center text-muted-foreground font-medium">
              <p>No laboratory rooms found</p>
              <p className="text-xs opacity-60 mt-1">Try another room name or location</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

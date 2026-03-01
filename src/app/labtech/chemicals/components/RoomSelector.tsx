'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchRooms } from '@/app/actions/labtech'

interface RoomSelectorProps {
  value: string
  onChange: (roomId: string) => void
  departmentId: number | null
  onSelect?: (room: { id: number; name: string }) => void
}

interface Room {
  id: number
  name: string
  location: string
  department: {
    id: number
    name: string
  }
}

export function RoomSelector({ value, onChange, departmentId, onSelect }: RoomSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<Room[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showDepartmentNotice, setShowDepartmentNotice] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle search with debounce (300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (searchTerm.length < 2) {
      setResults([])
      setIsSearching(false)
      setShowDepartmentNotice(false)
      return
    }

    setIsSearching(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const rooms = await searchRooms(searchTerm, departmentId)
        setResults(rooms)

        // Check if department has no rooms
        if (departmentId && rooms.length === 0) {
          // Try searching without department filter to show notice
          const allRooms = await searchRooms(searchTerm, null)
          if (allRooms.length > 0) {
            setShowDepartmentNotice(true)
            setResults(allRooms)
          }
        } else {
          setShowDepartmentNotice(false)
        }
      } catch (error) {
        console.error('Error searching rooms:', error)
        setResults([])
        setShowDepartmentNotice(false)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm, departmentId])

  // Clear selection when filtered list changes and selected room is no longer valid
  useEffect(() => {
    if (selectedRoom && departmentId) {
      // Check if selected room's department matches the filter
      if (selectedRoom.department.id !== departmentId) {
        handleClear()
      }
    }
  }, [departmentId, selectedRoom])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)

    // If user clears the input, clear the selection
    if (!newValue) {
      setSelectedRoom(null)
      onChange('')
      onSelect?.({ id: 0, name: '' })
    }
  }

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room)
    setSearchTerm(room.name)
    setIsOpen(false)
    onChange(room.id.toString())
    onSelect?.(room)
  }

  const handleClear = () => {
    setSelectedRoom(null)
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    setShowDepartmentNotice(false)
    onChange('')
    onSelect?.({ id: 0, name: '' })
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for room..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchTerm.length >= 2) {
              setIsOpen(true)
            }
          }}
          className={cn(
            "pl-10 h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300",
            selectedRoom && "pr-10"
          )}
        />
        {selectedRoom && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (searchTerm.length >= 2 || results.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-popover border rounded-xl shadow-lg overflow-hidden"
        >
          {showDepartmentNotice && (
            <div className="px-4 py-2 bg-muted/30 border-b text-xs text-muted-foreground">
              Recipient's department has no matching rooms. Showing all rooms.
            </div>
          )}

          {isSearching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              {results.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleRoomSelect(room)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 border-b last:border-b-0"
                >
                  <div className="mt-0.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {room.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {room.location} • {room.department.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No rooms found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

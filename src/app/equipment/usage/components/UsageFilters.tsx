"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface FilterState {
  search: string
  subjectId: number | null
  roomId: number | null
  dateFrom: Date | null
  dateTo: Date | null
}

interface UsageFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  subjects: Array<{ id: number; code: string; name: string }>
  rooms: Array<{ id: number; name: string; location: string }>
}

export function UsageFilters({
  filters,
  onFilterChange,
  subjects,
  rooms,
}: UsageFiltersProps) {
  const [searchInput, setSearchInput] = React.useState(filters.search)

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: searchInput })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  const handleSubjectChange = (value: string) => {
    onFilterChange({
      ...filters,
      subjectId: value === "all" ? null : parseInt(value),
    })
  }

  const handleRoomChange = (value: string) => {
    onFilterChange({
      ...filters,
      roomId: value === "all" ? null : parseInt(value),
    })
  }

  const handleDateFromChange = (value: string) => {
    onFilterChange({
      ...filters,
      dateFrom: value ? new Date(value) : null,
    })
  }

  const handleDateToChange = (value: string) => {
    onFilterChange({
      ...filters,
      dateTo: value ? new Date(value) : null,
    })
  }

  const clearDateRange = () => {
    onFilterChange({
      ...filters,
      dateFrom: null,
      dateTo: null,
    })
  }

  const hasDateRange = filters.dateFrom || filters.dateTo

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Chemical</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by chemical name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Subject Filter */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={filters.subjectId?.toString() || "all"}
            onValueChange={handleSubjectChange}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.code} - {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Room Filter */}
        <div className="space-y-2">
          <Label htmlFor="room">Room</Label>
          <Select
            value={filters.roomId?.toString() || "all"}
            onValueChange={handleRoomChange}
          >
            <SelectTrigger id="room">
              <SelectValue placeholder="All rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rooms</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id.toString()}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Picker */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateFromChange(e.target.value)}
              placeholder="From"
              className="flex-1"
            />
            <Input
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateToChange(e.target.value)}
              placeholder="To"
              className="flex-1"
            />
            {hasDateRange && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearDateRange}
                title="Clear date range"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

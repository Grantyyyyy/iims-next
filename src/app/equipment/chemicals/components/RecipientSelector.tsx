'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchStaffUsers } from '@/app/actions/labtech'

interface RecipientSelectorProps {
  value: string
  onChange: (userId: string) => void
  onUserSelect: (user: { id: number; departmentId: number | null; name: string }) => void
}

interface StaffUser {
  id: number
  firstName: string | null
  lastName: string | null
  username: string
  department: {
    id: number
    name: string
  } | null
}

export function RecipientSelector({ value, onChange, onUserSelect }: RecipientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<StaffUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null)
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
      return
    }

    setIsSearching(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const users = await searchStaffUsers(searchTerm)
        setResults(users)
      } catch (error) {
        console.error('Error searching users:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm])

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
      setSelectedUser(null)
      onChange('')
      onUserSelect({ id: 0, departmentId: null, name: '' })
    }
  }

  const handleUserSelect = (user: StaffUser) => {
    setSelectedUser(user)
    setSearchTerm(`${user.firstName} ${user.lastName}`)
    setIsOpen(false)
    onChange(user.id.toString())
    onUserSelect({
      id: user.id,
      departmentId: user.department?.id || null,
      name: getFullName(user)
    })
  }

  const handleClear = () => {
    setSelectedUser(null)
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    onChange('')
    onUserSelect({ id: 0, departmentId: null, name: '' })
    inputRef.current?.focus()
  }

  const getFullName = (user: StaffUser) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for STAFF user..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchTerm.length >= 2) {
              setIsOpen(true)
            }
          }}
          className={cn(
            "pl-10 h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300",
            selectedUser && "pr-10"
          )}
        />
        {selectedUser && (
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
          {isSearching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              {results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 border-b last:border-b-0"
                >
                  <div className="mt-0.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {getFullName(user)}
                    </div>
                    {user.department && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {user.department.name}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No STAFF users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

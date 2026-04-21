'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, BookOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchSubjects } from '@/app/actions/labtech'

interface SubjectSelectorProps {
  value: string
  onChange: (subjectId: string) => void
  onSelect?: (subject: { id: number; code: string; name: string }) => void
}

interface Subject {
  id: number
  code: string
  name: string
}

export function SubjectSelector({ value, onChange, onSelect }: SubjectSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<Subject[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
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
        const subjects = await searchSubjects(searchTerm)
        setResults(subjects)
      } catch (error) {
        console.error('Error searching subjects:', error)
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
      setSelectedSubject(null)
      onChange('')
      onSelect?.({ id: 0, code: '', name: '' })
    }
  }

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject)
    setSearchTerm(`${subject.code} - ${subject.name}`)
    setIsOpen(false)
    onChange(subject.id.toString())
    onSelect?.(subject)
  }

  const handleClear = () => {
    setSelectedSubject(null)
    setSearchTerm('')
    setResults([])
    setIsOpen(false)
    onChange('')
    onSelect?.({ id: 0, code: '', name: '' })
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for subject..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchTerm.length >= 2) {
              setIsOpen(true)
            }
          }}
          className={cn(
            "pl-10 h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300",
            selectedSubject && "pr-10"
          )}
        />
        {selectedSubject && (
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
              {results.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => handleSubjectSelect(subject)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3 border-b last:border-b-0"
                >
                  <div className="mt-0.5">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {subject.code}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {subject.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No subjects found
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

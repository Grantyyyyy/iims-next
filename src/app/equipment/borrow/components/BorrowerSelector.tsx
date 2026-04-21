'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { searchStaffUsers } from '../actions'
import type { BorrowerType, StaffUser } from '../types'

type BorrowerSelectorProps = {
  borrowerType: BorrowerType
  selectedBorrower: StaffUser | null
  studentName: string
  studentCourse: string
  studentYearLevel: string
  onBorrowerTypeChange: (type: BorrowerType) => void
  onBorrowerSelect: (borrower: StaffUser | null) => void
  onStudentInfoChange: (field: 'name' | 'course' | 'yearLevel', value: string) => void
}

export default function BorrowerSelector({
  borrowerType,
  selectedBorrower,
  studentName,
  studentCourse,
  studentYearLevel,
  onBorrowerTypeChange,
  onBorrowerSelect,
  onStudentInfoChange
}: BorrowerSelectorProps) {
  const [borrowerSearch, setBorrowerSearch] = useState('')
  const [borrowerResults, setBorrowerResults] = useState<StaffUser[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced staff search (300ms delay)
  useEffect(() => {
    if (borrowerType !== 'STAFF') return

    const timeoutId = setTimeout(async () => {
      if (borrowerSearch.length >= 2 && !selectedBorrower) {
        setIsSearching(true)
        try {
          const results = await searchStaffUsers(borrowerSearch)
          setBorrowerResults(results as unknown as StaffUser[])
        } finally {
          setIsSearching(false)
        }
      } else {
        setBorrowerResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [borrowerSearch, selectedBorrower, borrowerType])

  // Clear state when switching borrower types
  const handleBorrowerTypeChange = (type: BorrowerType) => {
    onBorrowerTypeChange(type)
    // Clear all borrower-related state
    onBorrowerSelect(null)
    setBorrowerSearch('')
    onStudentInfoChange('name', '')
    onStudentInfoChange('course', '')
    onStudentInfoChange('yearLevel', '')
  }

  return (
    <div className="space-y-4">
      {/* Borrower Type Toggle */}
      <div className="space-y-2">
        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Borrower Type</Label>
        <div className="flex p-1 bg-muted/50 backdrop-blur-sm rounded-xl gap-1 border border-border/50 shadow-inner">
          <Button
            type="button"
            variant="ghost"
            className={`flex-1 rounded-lg h-9 transition-all duration-300 font-bold text-xs ${borrowerType === 'STAFF'
              ? 'bg-background shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-primary scale-[1.01]'
              : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
              }`}
            onClick={() => handleBorrowerTypeChange('STAFF')}
          >
            Registered Staff
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`flex-1 rounded-lg h-9 transition-all duration-300 font-bold text-xs ${borrowerType === 'STUDENT'
              ? 'bg-background shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-primary scale-[1.01]'
              : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
              }`}
            onClick={() => handleBorrowerTypeChange('STUDENT')}
          >
            Manual Student
          </Button>
        </div>
      </div>

      <div className="h-[1px] bg-border/50" />

      {/* Staff Search Mode */}
      {borrowerType === 'STAFF' ? (
        <div className="space-y-3 relative">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Staff Member</Label>

          {selectedBorrower ? (
            <Card className="p-3 border-primary/20 bg-primary/5 flex items-center justify-between group transition-all duration-300 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                  <AvatarImage src={selectedBorrower.profilePicUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                    {selectedBorrower.firstName?.[0]}{selectedBorrower.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-base leading-none mb-1">
                    {selectedBorrower.firstName} {selectedBorrower.lastName}
                  </h4>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-bold tracking-wider">
                    <span className="opacity-70">ID: {selectedBorrower.customId}</span>
                    <span className="opacity-40">•</span>
                    <span className="opacity-70 truncate max-w-[120px]">{selectedBorrower.department?.name}</span>
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  onBorrowerSelect(null)
                  setBorrowerSearch('')
                }}
              >
                Change
              </Button>
            </Card>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff members..."
                className="pl-9 h-10 rounded-xl bg-muted/30 focus:bg-background transition-all text-sm"
                value={borrowerSearch}
                onChange={(e) => setBorrowerSearch(e.target.value)}
              />
              {isSearching && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          )}

          {/* Staff Search Results */}
          {!selectedBorrower && borrowerSearch.length >= 2 && (
            <Card className="absolute top-full mt-2 w-full z-20 shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-primary/10 rounded-2xl divide-y overflow-hidden bg-background/95 backdrop-blur-md">
              {borrowerResults.length > 0 ? (
                <div className="p-1.5">
                  {borrowerResults.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-primary/10 hover:text-primary rounded-xl cursor-pointer transition-all duration-200 group/item"
                      onClick={() => {
                        onBorrowerSelect(user)
                        setBorrowerSearch('')
                        setBorrowerResults([])
                      }}
                    >
                      <Avatar className="h-11 w-11 shadow-sm ring-2 ring-transparent group-hover/item:ring-primary/50 transition-all">
                        <AvatarImage src={user.profilePicUrl || undefined} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate group-hover/item:scale-[1.01] transition-transform">{user.firstName} {user.lastName}</p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider opacity-70">ID: {user.customId} • {user.department?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-sm text-center text-muted-foreground font-medium">
                  <p>No staff members found</p>
                  <p className="text-xs opacity-60 mt-1">Try another name or ID</p>
                </div>
              )}
            </Card>
          )}
        </div>
      ) : (
        /* Student Input Fields */
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Student Full Name</Label>
            <Input
              placeholder="Enter full name"
              className="h-10 rounded-xl bg-muted/20 focus:bg-background transition-all text-sm"
              value={studentName}
              onChange={(e) => onStudentInfoChange('name', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Course</Label>
              <Input
                placeholder="e.g. BSCS"
                className="h-10 rounded-xl bg-muted/20 focus:bg-background transition-all text-sm"
                value={studentCourse}
                onChange={(e) => onStudentInfoChange('course', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Year Level</Label>
              <Input
                placeholder="e.g. 1st Year"
                className="h-10 rounded-xl bg-muted/20 focus:bg-background transition-all text-sm"
                value={studentYearLevel}
                onChange={(e) => onStudentInfoChange('yearLevel', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

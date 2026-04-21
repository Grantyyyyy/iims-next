"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart3, TrendingUp, Award } from "lucide-react"
import { getUsageSummaryStats } from "../actions"
import type { FilterState } from "./UsageFilters"

interface UsageSummaryStatsProps {
  filters: FilterState
}

export function UsageSummaryStats({ filters }: UsageSummaryStatsProps) {
  const [stats, setStats] = React.useState<{
    totalUsageCount: number
    totalVolumeToday: number
    mostUsedChemical: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch stats when filters change
  React.useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const result = await getUsageSummaryStats({
          search: filters.search || undefined,
          subjectId: filters.subjectId || undefined,
          roomId: filters.roomId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        })
        setStats(result)
      } catch (error) {
        console.error("Error fetching summary stats:", error)
        setStats({
          totalUsageCount: 0,
          totalVolumeToday: 0,
          mostUsedChemical: null,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [filters])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage Count</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Used Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Chemical</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Usage Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Usage Count</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.totalUsageCount || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {filters.dateFrom || filters.dateTo
              ? "Filtered records"
              : "All time records"}
          </p>
        </CardContent>
      </Card>

      {/* Total Volume Used Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Volume Used Today</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.totalVolumeToday.toFixed(2) || "0.00"}
          </div>
          <p className="text-xs text-muted-foreground">
            Total units consumed today
          </p>
        </CardContent>
      </Card>

      {/* Most Used Chemical */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Used Chemical</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">
            {stats?.mostUsedChemical || "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            Highest total quantity used
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

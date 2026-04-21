import { requireAuth, hasPermission } from "@/lib/permissions"
import { getUsageRecords, getSubjects, getRooms } from "./actions"
import { UsageListClient } from "./UsageListClient"

export default async function UsageListPage() {
  // Check authentication
  const auth = await requireAuth()

  // Check if user has permission to manage chemicals
  const hasManagePermission = hasPermission(auth.roles, "manage:chemicals") && !auth.roles.includes('DEAN')

  // Fetch initial data
  const [usageData, subjects, rooms] = await Promise.all([
    getUsageRecords({ page: 1, pageSize: 15 }),
    getSubjects(),
    getRooms(),
  ])

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chemical Usage Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage chemical consumption across lab sessions
        </p>
      </div>

      <UsageListClient
        initialRecords={usageData.records}
        initialTotalPages={usageData.totalPages}
        subjects={subjects}
        rooms={rooms}
        hasPermission={hasManagePermission}
      />
    </div>
  )
}

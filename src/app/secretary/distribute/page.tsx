import { requirePermission } from "@/lib/permissions"
import { getAvailableItems, getRooms, getUsers } from "@/app/actions/secretary"
import DistributeClient from "./DistributeClient"

export default async function DistributePage() {
    // Only secretary can distribute
    await requirePermission('manage:items')

    // Fetch data concurrently
    const [items] = await Promise.all([
        getAvailableItems()
    ])

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Item Distribution</h2>
            </div>

            {/* The client component manages the interactive split-pane UI */}
            <DistributeClient
                initialItems={items}
            />
        </div>
    )
}

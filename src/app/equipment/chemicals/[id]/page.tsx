import { ChemicalDetailView } from "./ChemicalDetailView"
import { notFound } from "next/navigation"
import { requirePermission } from "@/lib/permissions"
import { getChemicalWithBatches } from "../actions"

export default async function ChemicalDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { roles } = await requirePermission('view:equipment')
    const isDean = roles.includes('DEAN')
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    if (isNaN(id)) {
        notFound()
    }

    const chemical = await getChemicalWithBatches(id)

    if (!chemical) {
        notFound()
    }

    return <ChemicalDetailView chemical={chemical} isReadOnly={isDean} />
}

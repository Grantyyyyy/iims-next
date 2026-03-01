import { getChemicalWithBatches } from "../actions"
import { ChemicalDetailView } from "./ChemicalDetailView"
import { notFound } from "next/navigation"

export default async function ChemicalDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    if (isNaN(id)) {
        notFound()
    }

    const chemical = await getChemicalWithBatches(id)

    if (!chemical) {
        notFound()
    }

    return <ChemicalDetailView chemical={chemical} />
}

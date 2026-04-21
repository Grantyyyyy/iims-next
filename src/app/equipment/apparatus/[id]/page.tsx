import { getApparatusWithDetails } from "../actions"
import { notFound } from "next/navigation"
import { ApparatusDetailView } from "./ApparatusDetailView"

export default async function ApparatusDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const apparatus = await getApparatusWithDetails(parseInt(id))

    if (!apparatus) {
        notFound()
    }

    return <ApparatusDetailView apparatus={apparatus} />
}

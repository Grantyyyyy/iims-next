import { getEquipmentWithInstances } from "../actions"
import { notFound } from "next/navigation"
import { EquipmentDetailView } from "./EquipmentDetailView"

export default async function EquipmentDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const equipment = await getEquipmentWithInstances(parseInt(id))

    if (!equipment) {
        notFound()
    }

    return <EquipmentDetailView equipment={equipment} />
}

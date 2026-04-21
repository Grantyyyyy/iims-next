import { requireAuth, getUserPrimaryRole } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getMyLabBorrows } from "@/app/actions/staff"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LabBorrowsTable } from "./LabBorrowsTable"

export default async function MyLabBorrowsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const { roles } = await requireAuth()
    if (getUserPrimaryRole(roles) !== "STAFF") redirect("/dashboard")

    const sp = await searchParams
    const search = sp.search || ""
    const status = sp.status as "active" | "returned" | "overdue" | undefined
    const type = sp.type as "equipment" | "apparatus" | undefined
    const dateFrom = sp.dateFrom || ""
    const dateTo = sp.dateTo || ""
    const page = parseInt(sp.page || "1", 10)

    const { records, total, pages } = await getMyLabBorrows({
        search,
        status,
        type,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
    })

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Lab Borrows</h1>
                <p className="text-muted-foreground">
                    Equipment and apparatus borrowed from Labtech
                </p>
            </div>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Lab Borrow Records</CardTitle>
                    <CardDescription>
                        All lab equipment and apparatus you have borrowed from the laboratory.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LabBorrowsTable
                        records={records as any}
                        total={total}
                        pages={pages}
                        currentPage={page}
                        currentSearch={search}
                        currentStatus={status || "all"}
                        currentType={type || "all"}
                        currentDateFrom={dateFrom}
                        currentDateTo={dateTo}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

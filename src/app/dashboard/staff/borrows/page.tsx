import { requireAuth, getUserPrimaryRole } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getMyBorrows } from "@/app/actions/staff"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BorrowsTable } from "./BorrowsTable"

export default async function MyBorrowsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const { roles } = await requireAuth()
    if (getUserPrimaryRole(roles) !== "STAFF") redirect("/dashboard")

    const sp = await searchParams
    const search = sp.search || ""
    const status = sp.status as "active" | "returned" | "overdue" | undefined
    const dateFrom = sp.dateFrom || ""
    const dateTo = sp.dateTo || ""
    const page = parseInt(sp.page || "1", 10)

    const { records, total, pages } = await getMyBorrows({
        search,
        status,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
    })

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Borrows</h1>
                <p className="text-muted-foreground">Items borrowed from Secretary</p>
            </div>
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Borrow Records</CardTitle>
                    <CardDescription>All items you have borrowed or received from the Secretary.</CardDescription>
                </CardHeader>
                <CardContent>
                    <BorrowsTable
                        records={records as any}
                        total={total}
                        pages={pages}
                        currentPage={page}
                        currentSearch={search}
                        currentStatus={status || "all"}
                        currentDateFrom={dateFrom}
                        currentDateTo={dateTo}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

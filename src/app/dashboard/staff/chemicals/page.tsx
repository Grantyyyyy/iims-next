import { requireAuth, getUserPrimaryRole } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getMyChemicals, getSubjects } from "@/app/actions/staff"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChemicalsTable } from "./ChemicalsTable"
import { FlaskConical, Calendar, BarChart2 } from "lucide-react"
import prisma from "@/lib/prisma"

export default async function MyChemicalsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const { user, roles } = await requireAuth()
    if (getUserPrimaryRole(roles) !== "STAFF") redirect("/dashboard")

    const sp = await searchParams
    const search = sp.search || ""
    const subjectId = sp.subjectId ? parseInt(sp.subjectId, 10) : undefined
    const dateFrom = sp.dateFrom || ""
    const dateTo = sp.dateTo || ""
    const page = parseInt(sp.page || "1", 10)

    const [{ records, total, pages }, subjects, allRecords] = await Promise.all([
        getMyChemicals({ search, subjectId, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page }),
        getSubjects(),
        // Get all records for summary stats (unfiltered)
        (prisma.chemicalUsageRecord as any).findMany({
            where: { recipientId: user.id, isDistribution: true },
            include: { chemicalBatch: { include: { chemical: true } } },
            orderBy: { dateUsed: "desc" },
        }),
    ])

    // Summary stats
    const totalReceived = allRecords.length
    const mostRecent = allRecords[0]?.dateUsed ?? null

    // Most received chemical by count
    const chemCounts: Record<string, { name: string; count: number }> = {}
    for (const r of allRecords) {
        const name = r.chemicalBatch?.chemical?.name
        if (name) {
            if (!chemCounts[name]) chemCounts[name] = { name, count: 0 }
            chemCounts[name].count++
        }
    }
    const mostReceivedChem = Object.values(chemCounts).sort((a, b) => b.count - a.count)[0]

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Chemicals</h1>
                <p className="text-muted-foreground">Chemicals received from Labtech</p>
            </div>

            {/* Summary stats row */}
            <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                <FlaskConical className="h-4 w-4 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalReceived}</p>
                                <p className="text-xs text-muted-foreground">Total Received</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <Calendar className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">
                                    {mostRecent
                                        ? new Date(mostRecent).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                        : "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">Most Recent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                <BarChart2 className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold truncate max-w-[140px]">
                                    {mostReceivedChem?.name || "—"}
                                </p>
                                <p className="text-xs text-muted-foreground">Most Received</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Chemical Records</CardTitle>
                    <CardDescription>All chemicals distributed to you by Labtech.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChemicalsTable
                        records={records as any}
                        total={total}
                        pages={pages}
                        currentPage={page}
                        currentSearch={search}
                        currentSubjectId={sp.subjectId || ""}
                        currentDateFrom={dateFrom}
                        currentDateTo={dateTo}
                        subjects={subjects}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

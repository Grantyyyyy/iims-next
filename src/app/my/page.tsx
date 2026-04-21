import { requireAuth, getUserPrimaryRole } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getStaffDashboardSummary } from "@/app/actions/staff"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Microscope, FlaskConical, AlertCircle } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { format } from "date-fns"

export default async function StaffOverviewPage() {
    const { user, roles } = await requireAuth()
    const primaryRole = getUserPrimaryRole(roles)
    if (primaryRole !== "STAFF") redirect("/dashboard")

    const [summary, fullUser] = await Promise.all([
        getStaffDashboardSummary(),
        prisma.user.findUnique({
            where: { id: user.id },
            select: { firstName: true, department: { select: { name: true } } },
        }),
    ])

    const firstName = fullUser?.firstName || user.username
    const department = fullUser?.department?.name || ""
    const today = format(new Date(), "EEEE, MMMM d, yyyy")

    const cards = [
        {
            label: "Active Borrows",
            value: summary.activeBorrows,
            icon: Package,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            href: "/my/borrows",
        },
        {
            label: "Active Lab Borrows",
            value: summary.activeLabBorrows,
            icon: Microscope,
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-950/30",
            href: "/my/lab-borrows",
        },
        {
            label: "Chemicals Received",
            value: summary.chemicalsReceived,
            icon: FlaskConical,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-950/30",
            href: "/my/chemicals",
        },
        {
            label: "Overdue Items",
            value: summary.overdueItems,
            icon: AlertCircle,
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-950/30",
            href: "/my/borrows?status=overdue",
            alwaysRed: true,
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Welcome back, {firstName} 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    {today}
                    {department && ` · ${department}`}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon
                    return (
                        <Link key={card.label} href={card.href}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">
                                        {card.label}
                                    </CardTitle>
                                    <div className={`p-2 rounded-lg ${card.bg}`}>
                                        <Icon className={`h-4 w-4 ${card.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className={`text-3xl font-bold ${card.alwaysRed || (card.label === "Overdue Items" && card.value > 0)
                                                ? "text-red-600"
                                                : ""
                                            }`}
                                    >
                                        {card.value}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your last 10 item interactions</CardDescription>
                </CardHeader>
                <CardContent>
                    {summary.recentActivity.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <p className="text-4xl mb-3">📋</p>
                            <p className="font-medium">No recent activity</p>
                            <p className="text-sm">
                                Borrows, returns, and received chemicals will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {summary.recentActivity.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 py-3 border-b last:border-0"
                                >
                                    <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-tight">
                                            {item.description}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {format(new Date(item.date), "MMM d, yyyy")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

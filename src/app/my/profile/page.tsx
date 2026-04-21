import { requireAuth, getUserPrimaryRole } from "@/lib/permissions"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProfileForm } from "./ProfileForm"
import { format } from "date-fns"
import { User } from "lucide-react"

export default async function MyProfilePage() {
    const { user, roles } = await requireAuth()
    if (getUserPrimaryRole(roles) !== "STAFF") redirect("/dashboard")

    const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            customId: true,
            isActive: true,
            createdAt: true,
            departmentId: true,
            department: { select: { name: true } },
        },
    })

    if (!fullUser) redirect("/login")

    const displayName = [fullUser.firstName, fullUser.lastName].filter(Boolean).join(" ") || fullUser.username
    const initials = [fullUser.firstName?.[0], fullUser.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase() || fullUser.username.slice(0, 2).toUpperCase()
    const customIdDisplay = fullUser.customId
        ? `IIMS-${String(fullUser.customId).padStart(4, "0")}`
        : "—"

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">View and edit your account information.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Left — Profile Card (40%) */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="items-center text-center pb-4">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                                <span className="text-2xl font-bold text-primary">{initials}</span>
                            </div>
                            <CardTitle className="text-xl">{displayName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{fullUser.email}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Role</span>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Staff</Badge>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Department</span>
                                <span className="text-sm font-medium text-right max-w-[160px] truncate">
                                    {fullUser.department?.name || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Custom ID</span>
                                <span className="text-sm font-mono font-medium">{customIdDisplay}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-muted-foreground">Member Since</span>
                                <span className="text-sm font-medium">
                                    {format(new Date(fullUser.createdAt), "MMM d, yyyy")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-muted-foreground">Status</span>
                                <Badge
                                    variant="outline"
                                    className={fullUser.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}
                                >
                                    {fullUser.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right — Edit Form (60%) */}
                <div className="lg:col-span-3">
                    <ProfileForm
                        userId={fullUser.id}
                        firstName={fullUser.firstName}
                        lastName={fullUser.lastName}
                        email={fullUser.email}
                    />
                </div>
            </div>
        </div>
    )
}

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDashboardStats } from "@/actions/dashboard"
import { getCurrentUser } from "@/actions/user"
import {
  Users,
  Package,
  Microscope,
  Beaker,
  ClipboardList,
  AlertCircle,
  Building2,
  FolderOpen,
} from "lucide-react"

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const currentUser = await getCurrentUser()
  const sidebarUser = currentUser ? {
    name: currentUser.username,
    email: currentUser.email,
    avatar: currentUser.profilePicUrl || '/avatars/user.jpg',
  } : undefined

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Across {stats.totalDepartments} departments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Secretary Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  In {stats.totalCategories} categories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lab Equipment</CardTitle>
                <Microscope className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEquipment}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalChemicals} chemicals tracked
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingTransfers} transfers, {stats.pendingReplaces} replacements
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detail Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Borrow Activity</CardTitle>
                <CardDescription>Latest equipment borrowing records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentBorrows.length > 0 ? stats.recentBorrows.map((record: any) => (
                    <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {record.itemInstance.item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Borrowed by {record.borrower?.username || record.customBorrower || 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.borrowDate).toLocaleDateString()}
                        </p>
                        {record.returnRecord ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-[10px]">Returned</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">Borrowed</Badge>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No borrow records yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Navigation</CardTitle>
                <CardDescription>Jump to frequently used modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <a href="/secretary/items" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <Package className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Secretary Items</p>
                      <p className="text-xs text-muted-foreground">Manage inventory</p>
                    </div>
                  </a>
                  <a href="/labtech/equipment" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <Microscope className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Lab Equipment</p>
                      <p className="text-xs text-muted-foreground">View instruments</p>
                    </div>
                  </a>
                  <a href="/labtech/chemicals" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <Beaker className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Chemicals</p>
                      <p className="text-xs text-muted-foreground">Stock levels</p>
                    </div>
                  </a>
                  <a href="/staff" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                    <ClipboardList className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Staff Requests</p>
                      <p className="text-xs text-muted-foreground">{stats.pendingRequests} pending</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

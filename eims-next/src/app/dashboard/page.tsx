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
import { requireAuth, getUserPrimaryRole, hasPermission } from "@/lib/permissions"
import prisma from "@/lib/prisma"
import {
  Users,
  Package,
  Microscope,
  Beaker,
  ClipboardList,
  AlertCircle,
  Building2,
  FolderOpen,
  Info,
} from "lucide-react"
import Link from "next/link"
import { SummaryCards } from "@/components/reports/summary-cards"
import { BorrowTrendsChart } from "@/components/reports/borrow-trends-chart"
import { getReportSummary } from "@/app/actions/reports"
import { Suspense } from "react"

export default async function DashboardPage() {
  const { user, roles } = await requireAuth()
  const primaryRole = getUserPrimaryRole(roles)

  const sidebarUser = {
    name: user.username,
    email: user.email,
    avatar: user.profilePicUrl || '/avatars/user.jpg',
  }

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} userRoles={roles} />
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
          {/* ICTC / SUPPLY — limited access message */}
          {(primaryRole === 'ICTC' || primaryRole === 'SUPPLY') && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <CardTitle>Welcome to EIMS</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your account is set up. Contact admin to get module access assigned.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ADMIN Dashboard */}
          {primaryRole === 'ADMIN' && <AdminDashboard />}

          {/* SECRETARY Dashboard */}
          {primaryRole === 'SECRETARY' && <SecretaryDashboard />}

          {/* LABTECH Dashboard */}
          {primaryRole === 'LABTECH' && <LabtechDashboard />}

          {/* DEAN Dashboard */}
          {primaryRole === 'DEAN' && <DeanDashboard />}

          {/* STAFF Dashboard */}
          {primaryRole === 'STAFF' && <StaffDashboard userId={user.id} />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

// ---------------------------------------------------------------------------
// ADMIN Dashboard
// ---------------------------------------------------------------------------
async function AdminDashboard() {
  const stats = await getDashboardStats()
  const reportStats = await getReportSummary()

  return (
    <>
      <Suspense fallback={<SummaryCards stats={null} loading={true} />}>
        <SummaryCards stats={reportStats} loading={false} />
      </Suspense>

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

      <div className="w-full">
        <BorrowTrendsChart />
      </div>

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
              <Link href="/secretary/items" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Secretary Items</p>
                  <p className="text-xs text-muted-foreground">Manage inventory</p>
                </div>
              </Link>
              <Link href="/labtech/equipment" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                <Microscope className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Lab Equipment</p>
                  <p className="text-xs text-muted-foreground">View instruments</p>
                </div>
              </Link>
              <Link href="/labtech/chemicals" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                <Beaker className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Chemicals</p>
                  <p className="text-xs text-muted-foreground">Stock levels</p>
                </div>
              </Link>
              <Link href="/staff" className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                <ClipboardList className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Staff Requests</p>
                  <p className="text-xs text-muted-foreground">Manage requests</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// SECRETARY Dashboard
// ---------------------------------------------------------------------------
async function SecretaryDashboard() {
  const [totalItems, totalCategories, activeBorrows] = await Promise.all([
    prisma.item.count(),
    prisma.category.count(),
    prisma.borrowRecord.count({
      where: { returnRecord: null },
    }),
  ])

  const recentBorrows = await prisma.borrowRecord.findMany({
    take: 5,
    orderBy: { borrowDate: 'desc' },
    include: {
      itemInstance: { include: { item: true } },
      borrower: true,
      returnRecord: true,
    },
  })

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Borrows</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBorrows}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategories}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Borrows</CardTitle>
          <CardDescription>Latest borrowing records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBorrows.length > 0 ? recentBorrows.map((record: any) => (
              <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{record.itemInstance.item.name}</p>
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
    </>
  )
}

// ---------------------------------------------------------------------------
// LABTECH Dashboard
// ---------------------------------------------------------------------------
async function LabtechDashboard() {
  const [totalEquipment, totalChemicals] = await Promise.all([
    prisma.equipment.count(),
    prisma.chemical.count(),
  ])

  // Low stock alerts — chemicals below reorder level
  const lowStockChemicals = await prisma.chemical.findMany({
    where: {
      volume: { lte: prisma.chemical.fields.reorderLevel as any },
    },
    take: 5,
  })

  // Query using raw comparison for low stock
  const lowStockList = await prisma.chemical.findMany({
    take: 5,
    orderBy: { volume: 'asc' },
  })

  // Expiring chemicals (within 30 days)
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const expiringStocks = await prisma.chemicalStock.findMany({
    where: {
      expiryDate: {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      },
    },
    include: { chemical: true },
    take: 5,
    orderBy: { expiryDate: 'asc' },
  })

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
            <Microscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipment}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chemicals</CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChemicals}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Chemicals</CardTitle>
            <CardDescription>Chemicals with lowest current volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockList.length > 0 ? lowStockList.map((chemical: any) => (
                <div key={chemical.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{chemical.name}</p>
                    <p className="text-xs text-muted-foreground">{chemical.unit || 'units'}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={chemical.volume <= chemical.reorderLevel ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {chemical.volume} {chemical.unit || ''}
                    </Badge>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No chemicals tracked yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Chemicals</CardTitle>
            <CardDescription>Stocks expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringStocks.length > 0 ? expiringStocks.map((stock: any) => (
                <div key={stock.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{stock.chemical.name}</p>
                    <p className="text-xs text-muted-foreground">Inv: {stock.inventoryNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Expires: {stock.expiryDate ? new Date(stock.expiryDate).toLocaleDateString() : 'N/A'}
                    </p>
                    <Badge variant="destructive" className="text-[10px]">Expiring</Badge>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No expiring stocks.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// DEAN Dashboard (read-only summary)
// ---------------------------------------------------------------------------
async function DeanDashboard() {
  const stats = await getDashboardStats()
  const reportStats = await getReportSummary()

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<SummaryCards stats={null} loading={true} />}>
        <SummaryCards stats={reportStats} loading={false} />
      </Suspense>

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
            <CardTitle className="text-sm font-medium">Active Borrows</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBorrowRecords}</div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <BorrowTrendsChart />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// STAFF Dashboard
// ---------------------------------------------------------------------------
async function StaffDashboard({ userId }: { userId: number }) {
  const [myBorrows, myChemicals, myTransfers, myReplaces, myDisposals] = await Promise.all([
    prisma.borrowRecord.findMany({
      where: { borrowerId: userId, returnRecord: null },
      include: { itemInstance: { include: { item: true } }, room: true },
      take: 5,
      orderBy: { borrowDate: 'desc' },
    }),
    prisma.chemicalAssignment.findMany({
      where: { assigneeId: userId },
      include: { chemicalStock: { include: { chemical: true } }, room: true },
      take: 5,
      orderBy: { processedDate: 'desc' },
    }),
    prisma.transferRequest.count({ where: { requestedById: userId, status: 'PENDING' } }),
    prisma.replaceRequest.count({ where: { requestedById: userId, status: 'PENDING' } }),
    prisma.disposeRequest.count({ where: { requestedById: userId, status: 'PENDING' } }),
  ])

  const pendingRequests = myTransfers + myReplaces + myDisposals

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Active Borrows</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myBorrows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Chemicals</CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myChemicals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Currently Borrowed Items</CardTitle>
            <CardDescription>Items you currently have borrowed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myBorrows.length > 0 ? myBorrows.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{record.itemInstance.item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.room?.name || 'No room'} · Qty: {record.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.borrowDate).toLocaleDateString()}
                    </p>
                    <Badge variant="destructive" className="text-[10px]">Active</Badge>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No active borrows.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Received Chemicals</CardTitle>
            <CardDescription>Chemicals assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myChemicals.length > 0 ? myChemicals.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{assignment.chemicalStock.chemical.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.room?.name || 'No room'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Vol: {assignment.assignedVolume}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">Assigned</Badge>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No chemical assignments.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

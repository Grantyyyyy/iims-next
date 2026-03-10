import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { verifySession } from "@/lib/session"
import prisma from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  Box,
  FlaskConical,
  History,
  BarChart3,
  ArrowUpRight
} from "lucide-react"

async function getAuthenticatedUser() {
  const session = await verifySession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profilePicUrl: true
    }
  })

  if (!user) return null

  return {
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
    email: user.email,
    image: user.profilePicUrl
  }
}

export default async function LandingPage() {
  const user = await getAuthenticatedUser()

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10">
      <Navbar user={user} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background opacity-70" />
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] -z-10 rounded-full animate-pulse" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] -z-10 rounded-full animate-pulse decoration-3000" />

          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Next-Gen Inventory Management
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                Manage Your Assets with <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-600 bg-clip-text text-transparent">
                  Precision & Speed
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                The all-in-one Inventory Information Management System tailored for modern lab technicians and administrators. Streamline equipment tracking and chemical management.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
                {user ? (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full h-14 rounded-2xl px-8 font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-4 group">
                      Return to Dashboard
                      <LayoutDashboard className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full h-14 rounded-2xl px-10 font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-3 group border-none bg-gradient-to-r from-primary to-primary/80">
                        Get Started
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 rounded-2xl px-8 font-bold text-lg hover:bg-muted/50 transition-all active:scale-95 border-border/50">
                      Watch Demo
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Visual Asset Preview */}
            <div className="mt-20 relative max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-700">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-500/30 blur-2xl opacity-20 -z-10" />
              <div className="rounded-[2.5rem] border border-border/60 bg-muted/20 backdrop-blur-3xl p-4 overflow-hidden shadow-2xl">
                <div className="rounded-[1.5rem] border border-border/50 bg-background/80 overflow-hidden aspect-[16/9] flex items-center justify-center group relative cursor-pointer shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col items-center gap-4 z-10 transition-transform group-hover:scale-105">
                    <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner">
                      <ShieldCheck className="h-12 w-12 text-primary" />
                    </div>
                    <span className="font-black text-muted-foreground uppercase tracking-[0.3em] text-[10px]">Secure System Interface</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Preview Grid */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-1000 delay-700">
              <FeatureCard
                icon={<Box className="h-6 w-6 text-primary" />}
                title="Equipment Tracking"
                description="Comprehensive lifecycle management for all lab equipment and apparatus."
              />
              <FeatureCard
                icon={<FlaskConical className="h-6 w-6 text-purple-500" />}
                title="Chemical Inventory"
                description="Real-time FIFO batch tracking with expiry alerts and automated reordering."
              />
              <FeatureCard
                icon={<History className="h-6 w-6 text-blue-500" />}
                title="Audit Trails"
                description="Detailed logs for every transaction, borrow, and usage record."
              />
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-muted/30 -skew-y-3 origin-right -z-10 translate-y-12" />
          <div className="container mx-auto px-6 text-center space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              <StatItem value="10k+" label="Items Tracked" />
              <StatItem value="500+" label="Active Users" />
              <StatItem value="98%" label="Efficiency Gain" />
              <StatItem value="24/7" label="Reliability" />
            </div>
          </div>
        </section>

        {/* Experience Detail Section */}
        <section id="about" className="py-32 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row gap-20 items-center">
              <div className="flex-1 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                    Designed for the <br />
                    <span className="text-primary italic">Modern Laboratory</span>
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    IIMS bridges the gap between chaotic spreadsheets and precision management. Our interface is built to minimize cognitive load while maximizing data visibility.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <DetailItem
                    title="QR Integration"
                    desc="Scan and track instantly with mobile-first QR code support."
                  />
                  <DetailItem
                    title="Permission Layers"
                    desc="Granular access control for Staff, Labtechs, and Admins."
                  />
                  <DetailItem
                    title="Advanced Analytics"
                    desc="Beautifully visualized data for inventory trends and usage."
                  />
                  <DetailItem
                    title="Cloud Sync"
                    desc="Access your inventory data from any device, anywhere."
                  />
                </div>
              </div>

              <div className="flex-1 relative">
                <div className="absolute -inset-10 bg-primary/5 blur-3xl -z-10 rounded-full" />
                <div className="relative rounded-[3rem] border border-border/50 bg-background shadow-2xl overflow-hidden p-8 aspect-square flex flex-col justify-center gap-10">
                  <div className="flex items-center gap-6 animate-pulse">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted rounded-full" />
                      <div className="h-3 w-48 bg-muted/60 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 animate-pulse delay-300">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-muted rounded-full" />
                      <div className="h-3 w-24 bg-muted/60 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 animate-pulse delay-700">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <Box className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-muted rounded-full" />
                      <div className="h-3 w-56 bg-muted/60 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-32">
          <div className="container mx-auto px-6">
            <div className="relative rounded-[3rem] bg-zinc-950 dark:bg-primary/10 overflow-hidden py-20 px-10 text-center space-y-8 border border-white/5 shadow-2xl shadow-primary/10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10 -z-10" />
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                Ready to revolutionize your <br className="hidden md:block" /> inventory management?
              </h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                Join hundreds of lab technicians already using IIMS to simplify their daily workflows.
              </p>
              <div className="pt-4">
                <Link href={user ? "/dashboard" : "/login"}>
                  <Button size="lg" className="h-16 rounded-2xl px-12 font-bold text-xl shadow-2xl shadow-primary/40 bg-white text-black hover:bg-zinc-200 transition-all active:scale-95">
                    {user ? "Go to Dashboard" : "Start Now — It's Free"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold">IIMS.</span>
            <span className="text-muted-foreground text-sm ml-4">© 2026 Accurate Systems Inc.</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-8 rounded-3xl border border-border/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300">
      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-6 border border-border/20 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Learn more <ArrowUpRight className="h-4 w-4" />
      </div>
    </div>
  )
}

function DetailItem({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-2 p-4 rounded-2xl hover:bg-muted/50 transition-colors group cursor-default">
      <h4 className="font-bold text-foreground flex items-center gap-2 group-hover:text-primary transition-colors">
        <div className="w-1.5 h-6 bg-primary rounded-full" />
        {title}
      </h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="space-y-2">
      <div className="text-4xl md:text-5xl font-black text-foreground tracking-tighter transition-all hover:scale-105 duration-300 cursor-default">
        {value}
      </div>
      <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

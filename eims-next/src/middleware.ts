import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Update this list to include routes that don't require authentication
const publicRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    const session = request.cookies.get('session')?.value

    // If there's no session and the user is trying to access a protected route,
    // redirect them to the login page.
    if (!session && !isPublicRoute) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    // If there's a session and the user is trying to access a public auth route,
    // redirect them to the dashboard.
    if (session && isPublicRoute) {
        const dashboardUrl = new URL('/dashboard', request.url)
        return NextResponse.redirect(dashboardUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

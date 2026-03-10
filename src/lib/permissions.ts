import 'server-only'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Role Names
// ---------------------------------------------------------------------------
export type RoleName =
    | 'ADMIN'
    | 'SECRETARY'
    | 'LABTECH'
    | 'DEAN'
    | 'STAFF'
    | 'ICTC'
    | 'SUPPLY'

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------
export type Permission =
    | 'manage:users'
    | 'manage:departments'
    | 'manage:items'
    | 'manage:equipment'
    | 'manage:chemicals'
    | 'borrow:items'
    | 'borrow:equipment'
    | 'use:chemicals'
    | 'approve:requests'
    | 'submit:requests'
    | 'view:reports'
    | 'view:own-borrows'
    | 'view:own-chemicals'
    | 'manage:rooms'
    | 'view:users'
    | 'view:items'
    | 'view:equipment'
    | 'view:chemicals'
    | 'view:records'
    | 'view:rooms'
    | 'view:departments'
    | 'export:data'
    | 'print:reports'

// ---------------------------------------------------------------------------
// Role → Permissions Map
// ---------------------------------------------------------------------------
const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
    ADMIN: [
        'manage:users',
        'manage:departments',
        'manage:items',
        'manage:equipment',
        'manage:chemicals',
        'borrow:items',
        'borrow:equipment',
        'use:chemicals',
        'approve:requests',
        'submit:requests',
        'view:reports',
        'view:own-borrows',
        'view:own-chemicals',
        'manage:rooms',
        'view:users',
        'view:items',
        'view:equipment',
        'view:chemicals',
        'view:records',
        'export:data',
        'print:reports',
        'view:rooms',
        'view:departments',
    ],
    SECRETARY: [
        'manage:items',
        'borrow:items',
        'view:reports',
        'view:items',
        'view:records',
        'export:data',
        'print:reports',
    ],
    LABTECH: [
        'manage:equipment',
        'manage:chemicals',
        'borrow:equipment',
        'use:chemicals',
        'view:reports',
        'view:equipment',
        'view:chemicals',
        'view:records',
        'export:data',
    ],
    DEAN: [
        'view:reports',
        'view:users',
        'view:items',
        'view:equipment',
        'view:chemicals',
        'view:records',
        'export:data',
        'view:rooms',
        'view:departments',
    ],
    STAFF: [
        'submit:requests',
        'view:own-borrows',
        'view:own-chemicals',
    ],
    ICTC: [],
    SUPPLY: [],
}

// ---------------------------------------------------------------------------
// Role Priority (for displaying primary role)
// ---------------------------------------------------------------------------
const ROLE_PRIORITY: RoleName[] = [
    'ADMIN',
    'SECRETARY',
    'LABTECH',
    'DEAN',
    'STAFF',
    'ICTC',
    'SUPPLY',
]

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Check if any of the user's roles grant a specific permission.
 */
export function hasPermission(roles: string[], permission: Permission): boolean {
    return roles.some((roleName) => {
        const perms = ROLE_PERMISSIONS[roleName as RoleName]
        return perms?.includes(permission) ?? false
    })
}

/**
 * Get all permissions for a specific role.
 */
export function getRolePermissions(role: string): Permission[] {
    return ROLE_PERMISSIONS[role as RoleName] ?? []
}

/**
 * Get the highest-priority role name for display purposes.
 */
export function getUserPrimaryRole(roles: string[]): string {
    for (const role of ROLE_PRIORITY) {
        if (roles.includes(role)) return role
    }
    return roles[0] ?? 'STAFF'
}

// ---------------------------------------------------------------------------
// Server-side Auth Guards
// ---------------------------------------------------------------------------

export interface AuthResult {
    user: {
        id: number
        username: string
        email: string
        firstName: string | null
        lastName: string | null
        profilePicUrl: string | null
    }
    roles: string[]
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Returns the current user and their role names.
 */
export async function requireAuth(): Promise<AuthResult> {
    const session = await verifySession()

    if (!session?.userId) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePicUrl: true,
            isActive: true, // Added isActive
            roles: {
                include: { role: true },
            },
        },
    })

    if (!user) {
        redirect('/login')
    }

    if (!user.isActive) {
        // Option 1: Redirect to login with error (requires search params handling in login page)
        // Option 2: Delete session and redirect
        // For now, let's just redirect to login. The user will be logged out eventually or blocked.
        redirect('/login?error=account_deactivated')
    }

    const roles = user.roles.map((ur) => ur.role.name)

    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicUrl: user.profilePicUrl,
        },
        roles,
    }
}

/**
 * Require a specific permission. Redirects to /dashboard if unauthorized.
 * Also redirects to /login if not authenticated.
 */
export async function requirePermission(permission: Permission): Promise<AuthResult> {
    const auth = await requireAuth()

    if (!hasPermission(auth.roles, permission)) {
        redirect('/dashboard')
    }

    return auth
}

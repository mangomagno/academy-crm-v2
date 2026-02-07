'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { User, UserRole } from '@/types';

// ============================================================================
// Current User Hook
// ============================================================================

interface CurrentUserResult {
    /** Full user data from database */
    user: User | undefined;
    /** Auth.js session */
    session: ReturnType<typeof useSession>['data'];
    /** True while loading session or user data */
    loading: boolean;
    /** True if session exists and is authenticated */
    isAuthenticated: boolean;
}

/**
 * Get the current authenticated user with full database info
 */
export function useCurrentUser(): CurrentUserResult {
    const { data: session, status } = useSession();

    const userId = session?.user?.id;

    const user = useLiveQuery(
        () => (userId ? db.users.get(userId) : undefined),
        [userId]
    );

    const loading = status === 'loading' || (status === 'authenticated' && user === undefined);
    const isAuthenticated = status === 'authenticated';

    return useMemo(() => ({
        user,
        session,
        loading,
        isAuthenticated
    }), [user, session, loading, isAuthenticated]);
}

// ============================================================================
// Role Authorization Hooks
// ============================================================================

interface RequireRoleResult {
    /** True if user has one of the allowed roles */
    isAuthorized: boolean;
    /** True while checking authorization */
    loading: boolean;
}

/**
 * Redirect if user doesn't have one of the required roles
 * 
 * @param allowedRoles - Array of roles that are allowed to access
 * @param redirectTo - Path to redirect to if unauthorized (default: '/login')
 */
export function useRequireRole(
    allowedRoles: UserRole[],
    redirectTo: string = '/login'
): RequireRoleResult {
    const router = useRouter();
    const { data: session, status } = useSession();

    const loading = status === 'loading';
    const isAuthenticated = status === 'authenticated';
    const userRole = session?.user?.role;
    const isAuthorized = isAuthenticated && userRole !== undefined && allowedRoles.includes(userRole);

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            router.replace(redirectTo);
            return;
        }

        if (!isAuthorized) {
            // User is authenticated but doesn't have required role
            // Redirect to their appropriate dashboard
            if (userRole === 'admin') {
                router.replace('/admin');
            } else if (userRole === 'teacher') {
                router.replace('/dashboard');
            } else if (userRole === 'student') {
                router.replace('/teachers');
            } else {
                router.replace(redirectTo);
            }
        }
    }, [loading, isAuthenticated, isAuthorized, userRole, router, redirectTo]);

    return { isAuthorized, loading };
}

// ============================================================================
// Teacher Approval Hook
// ============================================================================

interface RequireApprovedTeacherResult {
    /** True if teacher is approved */
    isApproved: boolean;
    /** True while checking status */
    loading: boolean;
}

/**
 * Redirect if teacher is not approved
 * Only applicable for users with teacher role
 * 
 * @param redirectTo - Path to redirect to if not approved (default: '/pending-approval')
 */
export function useRequireApprovedTeacher(
    redirectTo: string = '/pending-approval'
): RequireApprovedTeacherResult {
    const router = useRouter();
    const { data: session, status } = useSession();

    const loading = status === 'loading';
    const isAuthenticated = status === 'authenticated';
    const userRole = session?.user?.role;
    const teacherStatus = session?.user?.teacherStatus;

    const isApproved = userRole === 'teacher' && teacherStatus === 'approved';

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        if (userRole !== 'teacher') {
            // Not a teacher, redirect based on role
            if (userRole === 'admin') {
                router.replace('/admin');
            } else if (userRole === 'student') {
                router.replace('/teachers');
            }
            return;
        }

        if (teacherStatus === 'pending') {
            router.replace(redirectTo);
        } else if (teacherStatus === 'rejected') {
            router.replace('/registration-rejected');
        }
    }, [loading, isAuthenticated, userRole, teacherStatus, router, redirectTo]);

    return { isApproved, loading };
}

// ============================================================================
// Auth State Helpers
// ============================================================================

/**
 * Simple hook to check if user is authenticated without redirects
 */
export function useIsAuthenticated(): { isAuthenticated: boolean; loading: boolean } {
    const { status } = useSession();

    return {
        isAuthenticated: status === 'authenticated',
        loading: status === 'loading'
    };
}

/**
 * Get the current user's role
 */
export function useUserRole(): UserRole | undefined {
    const { data: session } = useSession();
    return session?.user?.role;
}

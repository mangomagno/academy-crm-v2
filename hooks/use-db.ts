'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type {
    User,
    TeacherProfile,
    Availability,
    BlockedSlot,
    Subscription,
    Lesson,
    Payment,
    Notification,
    TeacherStatus,
    LessonStatus
} from '@/types';

// ============================================================================
// User Hooks
// ============================================================================

/**
 * Get all users
 */
export function useUsers(): User[] | undefined {
    return useLiveQuery(() => db.users.toArray());
}

/**
 * Get teachers, optionally filtered by status
 */
export function useTeachers(status?: TeacherStatus): User[] | undefined {
    return useLiveQuery(
        () => {
            const query = db.users.where('role').equals('teacher');
            if (status) {
                return query.and(user => user.teacherStatus === status).toArray();
            }
            return query.toArray();
        },
        [status]
    );
}

/**
 * Get all students
 */
export function useStudents(): User[] | undefined {
    return useLiveQuery(() => db.users.where('role').equals('student').toArray());
}

/**
 * Get a user by ID
 */
export function useUserById(id: string | undefined): User | undefined {
    return useLiveQuery(
        () => (id ? db.users.get(id) : undefined),
        [id]
    );
}

// ============================================================================
// Teacher Profile Hooks
// ============================================================================

/**
 * Get teacher profile by user ID
 */
export function useTeacherProfile(userId: string | undefined): TeacherProfile | undefined {
    return useLiveQuery(
        () => (userId ? db.teacherProfiles.get(userId) : undefined),
        [userId]
    );
}

/**
 * Get all teacher profiles
 */
export function useTeacherProfiles(): TeacherProfile[] | undefined {
    return useLiveQuery(() => db.teacherProfiles.toArray());
}

// ============================================================================
// Availability Hooks
// ============================================================================

/**
 * Get availability for a teacher
 */
export function useAvailability(teacherId: string | undefined): Availability[] | undefined {
    return useLiveQuery(
        () => {
            if (!teacherId) return [] as Availability[];
            return db.availability.where('teacherId').equals(teacherId).toArray();
        },
        [teacherId]
    );
}

// ============================================================================
// Blocked Slots Hooks
// ============================================================================

/**
 * Get blocked slots for a teacher
 */
export function useBlockedSlots(teacherId: string | undefined): BlockedSlot[] | undefined {
    return useLiveQuery(
        () => {
            if (!teacherId) return [] as BlockedSlot[];
            return db.blockedSlots.where('teacherId').equals(teacherId).toArray();
        },
        [teacherId]
    );
}

// ============================================================================
// Subscription Hooks
// ============================================================================

/**
 * Get subscriptions, optionally filtered by student or teacher
 */
export function useSubscriptions(
    studentId?: string,
    teacherId?: string
): Subscription[] | undefined {
    return useLiveQuery(
        () => {
            if (studentId && teacherId) {
                return db.subscriptions
                    .where('[studentId+teacherId]')
                    .equals([studentId, teacherId])
                    .toArray();
            }
            if (studentId) {
                return db.subscriptions.where('studentId').equals(studentId).toArray();
            }
            if (teacherId) {
                return db.subscriptions.where('teacherId').equals(teacherId).toArray();
            }
            return db.subscriptions.toArray();
        },
        [studentId, teacherId]
    );
}

/**
 * Check if a student is subscribed to a teacher
 */
export function useIsSubscribed(
    studentId: string | undefined,
    teacherId: string | undefined
): boolean {
    const subscription = useLiveQuery(
        () => (studentId && teacherId
            ? db.subscriptions
                .where('[studentId+teacherId]')
                .equals([studentId, teacherId])
                .first()
            : undefined),
        [studentId, teacherId]
    );
    return subscription !== undefined && subscription !== null;
}

// ============================================================================
// Lesson Hooks
// ============================================================================

/**
 * Get lessons with optional filters
 */
export function useLessons(
    teacherId?: string,
    studentId?: string,
    status?: LessonStatus
): Lesson[] | undefined {
    return useLiveQuery(
        () => {
            let collection = db.lessons.toCollection();

            if (teacherId) {
                collection = db.lessons.where('teacherId').equals(teacherId);
            } else if (studentId) {
                collection = db.lessons.where('studentId').equals(studentId);
            }

            return collection.toArray().then(lessons => {
                let filtered = lessons;

                if (teacherId && studentId) {
                    filtered = filtered.filter(l => l.studentId === studentId);
                }
                if (status) {
                    filtered = filtered.filter(l => l.status === status);
                }

                return filtered.sort((a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                );
            });
        },
        [teacherId, studentId, status]
    );
}

/**
 * Get today's lessons for a teacher
 */
export function useTodaysLessons(teacherId: string | undefined): Lesson[] | undefined {
    return useLiveQuery(
        () => {
            if (!teacherId) return [] as Lesson[];

            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

            return db.lessons
                .where('teacherId')
                .equals(teacherId)
                .toArray()
                .then(lessons =>
                    lessons
                        .filter(l => {
                            const lessonDate = new Date(l.date);
                            return lessonDate >= startOfDay && lessonDate < endOfDay;
                        })
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                );
        },
        [teacherId]
    );
}

/**
 * Get upcoming lessons for a user (teacher or student)
 */
export function useUpcomingLessons(
    userId: string | undefined,
    role: 'teacher' | 'student'
): Lesson[] | undefined {
    return useLiveQuery(
        () => {
            if (!userId) return [] as Lesson[];

            const now = new Date();
            const field = role === 'teacher' ? 'teacherId' : 'studentId';

            return db.lessons
                .where(field)
                .equals(userId)
                .toArray()
                .then(lessons =>
                    lessons
                        .filter(l => new Date(l.date) >= now && l.status !== 'cancelled')
                        .sort((a, b) =>
                            new Date(a.date).getTime() - new Date(b.date).getTime()
                        )
                );
        },
        [userId, role]
    );
}

/**
 * Get pending lesson requests for a teacher
 */
export function usePendingLessons(teacherId: string | undefined): Lesson[] | undefined {
    return useLiveQuery(
        () => {
            if (!teacherId) return [] as Lesson[];

            return db.lessons
                .where('teacherId')
                .equals(teacherId)
                .and(l => l.status === 'pending')
                .toArray()
                .then(lessons =>
                    lessons.sort((a, b) =>
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    )
                );
        },
        [teacherId]
    );
}

// ============================================================================
// Payment Hooks
// ============================================================================

/**
 * Get payments with optional filters
 */
export function usePayments(
    teacherId?: string,
    month?: string
): Payment[] | undefined {
    return useLiveQuery(
        () => {
            let collection = db.payments.toCollection();

            if (teacherId) {
                collection = db.payments.where('teacherId').equals(teacherId);
            }

            return collection.toArray().then(payments => {
                if (month) {
                    return payments.filter(p => p.month === month);
                }
                return payments;
            });
        },
        [teacherId, month]
    );
}

/**
 * Get payment summary for a teacher in a specific month
 */
export function usePaymentSummary(
    teacherId: string | undefined,
    month: string
): { total: number; paid: number; unpaid: number } | undefined {
    return useLiveQuery(
        () => {
            if (!teacherId) return Promise.resolve({ total: 0, paid: 0, unpaid: 0 });

            return db.payments
                .where('teacherId')
                .equals(teacherId)
                .toArray()
                .then(payments => {
                    const monthPayments = payments.filter(p => p.month === month);
                    const paid = monthPayments
                        .filter(p => p.status === 'paid')
                        .reduce((sum, p) => sum + p.amount, 0);
                    const unpaid = monthPayments
                        .filter(p => p.status === 'unpaid')
                        .reduce((sum, p) => sum + p.amount, 0);

                    return {
                        total: paid + unpaid,
                        paid,
                        unpaid
                    };
                });
        },
        [teacherId, month]
    );
}

// ============================================================================
// Notification Hooks
// ============================================================================

/**
 * Get notifications for a user
 */
export function useNotifications(userId: string | undefined): Notification[] | undefined {
    return useLiveQuery(
        () => {
            if (!userId) return [] as Notification[];

            return db.notifications
                .where('userId')
                .equals(userId)
                .toArray()
                .then(notifications =>
                    notifications.sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                );
        },
        [userId]
    );
}

/**
 * Get unread notification count for a user
 */
export function useUnreadNotificationCount(userId: string | undefined): number {
    const count = useLiveQuery(
        () => {
            if (!userId) return 0;

            return db.notifications
                .where('userId')
                .equals(userId)
                .and(n => !n.read)
                .count();
        },
        [userId]
    );
    return count ?? 0;
}

import { db } from './db';
import { hashPassword, generateId } from './auth-utils';
import type {
    User,
    TeacherProfile,
    Availability,
    Subscription,
    Lesson,
    Payment,
    Notification
} from '@/types';

// ============================================================================
// Seed Data Constants
// ============================================================================

const SEED_PASSWORD = 'password123';

// User IDs (fixed for referential integrity)
const USER_IDS = {
    admin: 'admin-001',
    teacherMaria: 'teacher-maria-001',
    teacherCarlos: 'teacher-carlos-001',
    studentElena: 'student-elena-001',
    studentPablo: 'student-pablo-001'
} as const;

// ============================================================================
// Seed Data Generators
// ============================================================================

async function createUsers(): Promise<User[]> {
    const hashedPassword = await hashPassword(SEED_PASSWORD);
    const now = new Date();

    return [
        {
            id: USER_IDS.admin,
            email: 'admin@example.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'admin',
            createdAt: now
        },
        {
            id: USER_IDS.teacherMaria,
            email: 'maria@example.com',
            password: hashedPassword,
            name: 'María García',
            role: 'teacher',
            teacherStatus: 'approved',
            createdAt: now
        },
        {
            id: USER_IDS.teacherCarlos,
            email: 'carlos@example.com',
            password: hashedPassword,
            name: 'Carlos López',
            role: 'teacher',
            teacherStatus: 'pending',
            createdAt: now
        },
        {
            id: USER_IDS.studentElena,
            email: 'elena@example.com',
            password: hashedPassword,
            name: 'Elena Martínez',
            role: 'student',
            createdAt: now
        },
        {
            id: USER_IDS.studentPablo,
            email: 'pablo@example.com',
            password: hashedPassword,
            name: 'Pablo Ruiz',
            role: 'student',
            createdAt: now
        }
    ];
}

function createTeacherProfiles(): TeacherProfile[] {
    return [
        {
            userId: USER_IDS.teacherMaria,
            bio: 'Piano and vocal teacher with 10+ years of experience. Specialized in classical and jazz music.',
            hourlyRate: 35,
            lessonDurations: [30, 45, 60],
            autoAccept: true
        },
        {
            userId: USER_IDS.teacherCarlos,
            bio: 'Guitar instructor specializing in flamenco and classical styles. Patient and detail-oriented.',
            hourlyRate: 40,
            lessonDurations: [30, 60],
            autoAccept: false
        }
    ];
}

function createAvailability(): Availability[] {
    // María: Mon-Fri 09:00-17:00
    const mariaAvailability: Availability[] = [1, 2, 3, 4, 5].map(day => ({
        id: generateId(),
        teacherId: USER_IDS.teacherMaria,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00'
    }));

    // Carlos: Tue, Thu, Sat 10:00-20:00
    const carlosAvailability: Availability[] = [2, 4, 6].map(day => ({
        id: generateId(),
        teacherId: USER_IDS.teacherCarlos,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '20:00'
    }));

    return [...mariaAvailability, ...carlosAvailability];
}

function createSubscriptions(): Subscription[] {
    const now = new Date();
    return [
        {
            id: generateId(),
            studentId: USER_IDS.studentElena,
            teacherId: USER_IDS.teacherMaria,
            createdAt: now
        },
        {
            id: generateId(),
            studentId: USER_IDS.studentElena,
            teacherId: USER_IDS.teacherCarlos,
            createdAt: now
        },
        {
            id: generateId(),
            studentId: USER_IDS.studentPablo,
            teacherId: USER_IDS.teacherMaria,
            createdAt: now
        }
    ];
}

function createLessons(): Lesson[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Future dates
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));

    const nextTuesday = new Date(nextMonday);
    nextTuesday.setDate(nextMonday.getDate() + 1);

    const nextWednesday = new Date(nextMonday);
    nextWednesday.setDate(nextMonday.getDate() + 2);

    // Past date (last week)
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    return [
        // Confirmed lesson: María with Elena (future)
        {
            id: generateId(),
            teacherId: USER_IDS.teacherMaria,
            studentId: USER_IDS.studentElena,
            date: nextMonday,
            startTime: '10:00',
            endTime: '11:00',
            duration: 60,
            status: 'confirmed',
            notes: 'Continue with Chopin nocturne practice',
            createdAt: now
        },
        // Confirmed lesson: María with Pablo (future)
        {
            id: generateId(),
            teacherId: USER_IDS.teacherMaria,
            studentId: USER_IDS.studentPablo,
            date: nextWednesday,
            startTime: '14:00',
            endTime: '14:30',
            duration: 30,
            status: 'confirmed',
            createdAt: now
        },
        // Pending lesson: Carlos with Elena (future)
        {
            id: generateId(),
            teacherId: USER_IDS.teacherCarlos,
            studentId: USER_IDS.studentElena,
            date: nextTuesday,
            startTime: '11:00',
            endTime: '12:00',
            duration: 60,
            status: 'pending',
            notes: 'First flamenco lesson',
            createdAt: now
        },
        // Completed lesson: María with Elena (past)
        {
            id: generateId(),
            teacherId: USER_IDS.teacherMaria,
            studentId: USER_IDS.studentElena,
            date: lastWeek,
            startTime: '10:00',
            endTime: '11:00',
            duration: 60,
            status: 'completed',
            notes: 'Worked on scales and sight-reading',
            createdAt: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
    ];
}

function createPayments(lessons: Lesson[]): Payment[] {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    // Find completed and confirmed lessons
    const completedLesson = lessons.find(l => l.status === 'completed');
    const confirmedLesson = lessons.find(l => l.status === 'confirmed');

    const payments: Payment[] = [];

    if (completedLesson) {
        // Paid payment for completed lesson
        payments.push({
            id: generateId(),
            lessonId: completedLesson.id,
            teacherId: completedLesson.teacherId,
            studentId: completedLesson.studentId,
            amount: 35, // María's hourly rate
            status: 'paid',
            paidAt: new Date(completedLesson.date.getTime() + 3 * 24 * 60 * 60 * 1000),
            month: lastMonthStr
        });
    }

    if (confirmedLesson) {
        // Unpaid payment for upcoming lesson
        payments.push({
            id: generateId(),
            lessonId: confirmedLesson.id,
            teacherId: confirmedLesson.teacherId,
            studentId: confirmedLesson.studentId,
            amount: 35,
            status: 'unpaid',
            month: currentMonth
        });
    }

    return payments;
}

function createNotifications(): Notification[] {
    const now = new Date();

    return [
        {
            id: generateId(),
            userId: USER_IDS.teacherMaria,
            type: 'lesson_request',
            message: 'Elena Martínez ha solicitado una clase para el próximo lunes a las 10:00',
            read: true,
            relatedId: undefined,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        {
            id: generateId(),
            userId: USER_IDS.studentElena,
            type: 'lesson_confirmed',
            message: 'María García ha confirmado tu clase del próximo lunes a las 10:00',
            read: false,
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        },
        {
            id: generateId(),
            userId: USER_IDS.teacherCarlos,
            type: 'lesson_request',
            message: 'Elena Martínez ha solicitado una clase de flamenco',
            read: false,
            createdAt: now
        }
    ];
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Clear all data and reseed database with test data
 */
export async function seedDatabase(): Promise<void> {
    // Clear existing data
    await db.transaction('rw', db.tables, async () => {
        await db.users.clear();
        await db.teacherProfiles.clear();
        await db.availability.clear();
        await db.blockedSlots.clear();
        await db.subscriptions.clear();
        await db.lessons.clear();
        await db.payments.clear();
        await db.notifications.clear();
    });

    // Generate seed data
    const users = await createUsers();
    const teacherProfiles = createTeacherProfiles();
    const availability = createAvailability();
    const subscriptions = createSubscriptions();
    const lessons = createLessons();
    const payments = createPayments(lessons);
    const notifications = createNotifications();

    // Insert all data
    await db.transaction('rw', db.tables, async () => {
        await db.users.bulkAdd(users);
        await db.teacherProfiles.bulkAdd(teacherProfiles);
        await db.availability.bulkAdd(availability);
        await db.subscriptions.bulkAdd(subscriptions);
        await db.lessons.bulkAdd(lessons);
        await db.payments.bulkAdd(payments);
        await db.notifications.bulkAdd(notifications);
    });

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${users.length} users`);
    console.log(`   - ${teacherProfiles.length} teacher profiles`);
    console.log(`   - ${availability.length} availability slots`);
    console.log(`   - ${subscriptions.length} subscriptions`);
    console.log(`   - ${lessons.length} lessons`);
    console.log(`   - ${payments.length} payments`);
    console.log(`   - ${notifications.length} notifications`);
}

/**
 * Check if the database has any users
 */
export async function isDatabaseEmpty(): Promise<boolean> {
    const count = await db.users.count();
    return count === 0;
}

/**
 * Seed database only if it's empty
 * Returns true if seeding was performed
 */
export async function seedIfEmpty(): Promise<boolean> {
    const isEmpty = await isDatabaseEmpty();
    if (isEmpty) {
        await seedDatabase();
        return true;
    }
    return false;
}

/**
 * Get seed user credentials for testing
 */
export const SEED_CREDENTIALS = {
    admin: { email: 'admin@example.com', password: SEED_PASSWORD },
    teacherApproved: { email: 'maria@example.com', password: SEED_PASSWORD },
    teacherPending: { email: 'carlos@example.com', password: SEED_PASSWORD },
    student1: { email: 'elena@example.com', password: SEED_PASSWORD },
    student2: { email: 'pablo@example.com', password: SEED_PASSWORD }
} as const;

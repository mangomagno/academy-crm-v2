import Dexie, { type Table } from 'dexie';
import type {
    User,
    TeacherProfile,
    Availability,
    BlockedSlot,
    Subscription,
    Lesson,
    Payment,
    Notification
} from '@/types';

export class AcademyCRMDatabase extends Dexie {
    users!: Table<User, string>;
    teacherProfiles!: Table<TeacherProfile, string>;
    availability!: Table<Availability, string>;
    blockedSlots!: Table<BlockedSlot, string>;
    subscriptions!: Table<Subscription, string>;
    lessons!: Table<Lesson, string>;
    payments!: Table<Payment, string>;
    notifications!: Table<Notification, string>;

    constructor() {
        super('AcademyCRM');
        this.version(1).stores({
            users: 'id, email, role, teacherStatus',
            teacherProfiles: 'userId',
            availability: 'id, teacherId, dayOfWeek',
            blockedSlots: 'id, teacherId, date',
            subscriptions: 'id, studentId, teacherId, [studentId+teacherId]',
            lessons: 'id, teacherId, studentId, date, status, [teacherId+date], [studentId+date]',
            payments: 'id, lessonId, teacherId, studentId, status, month',
            notifications: 'id, userId, read, createdAt'
        });
    }

    async updatePaymentStatus(paymentId: string, status: 'paid' | 'unpaid') {
        return this.payments.update(paymentId, {
            status,
            paidAt: status === 'paid' ? new Date() : undefined
        });
    }
}

export const db = new AcademyCRMDatabase();

export type UserRole = 'admin' | 'teacher' | 'student';
export type TeacherStatus = 'pending' | 'approved' | 'rejected';
export type LessonStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';

export interface User {
    id: string;
    email: string;
    password: string; // hashed
    name: string;
    role: UserRole;
    teacherStatus?: TeacherStatus; // only for teachers
    createdAt: Date;
}

export interface TeacherProfile {
    userId: string;
    bio?: string;
    hourlyRate: number;
    lessonDurations: number[]; // e.g., [30, 45, 60]
    autoAccept: boolean;
}

export interface Availability {
    id: string;
    teacherId: string;
    dayOfWeek: number; // 0-6 (Sun-Sat)
    startTime: string; // "09:00"
    endTime: string;   // "17:00"
}

export interface BlockedSlot {
    id: string;
    teacherId: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    allDay: boolean;
    reason?: string;
}

export interface Subscription {
    id: string;
    studentId: string;
    teacherId: string;
    createdAt: Date;
}

export interface Lesson {
    id: string;
    teacherId: string;
    studentId: string;
    date: Date;
    startTime: string;
    endTime: string;
    duration: number; // minutes
    status: LessonStatus;
    notes?: string;
    createdAt: Date;
}

export interface Payment {
    id: string;
    lessonId: string;
    teacherId: string;
    studentId: string;
    amount: number;
    status: PaymentStatus;
    paidAt?: Date;
    month: string; // "2026-02"
}

export type NotificationType =
    | 'lesson_request'
    | 'lesson_confirmed'
    | 'lesson_cancelled'
    | 'reschedule_request'
    | 'teacher_approved';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    message: string;
    read: boolean;
    relatedId?: string;
    createdAt: Date;
}

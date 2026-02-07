import { db } from './db';
import type { NotificationType } from '@/types';

export async function createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    relatedId?: string
) {
    try {
        await db.notifications.add({
            id: crypto.randomUUID(),
            userId,
            type,
            message,
            read: false,
            relatedId,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}

export async function notifyLessonRequest(teacherId: string, studentName: string, lessonId: string) {
    await createNotification(
        teacherId,
        'lesson_request',
        `${studentName} has requested a new lesson.`,
        lessonId
    );
}

export async function notifyLessonConfirmed(studentId: string, teacherName: string, lessonId: string) {
    await createNotification(
        studentId,
        'lesson_confirmed',
        `${teacherName} has confirmed your lesson.`,
        lessonId
    );
}

export async function notifyLessonCancelled(userId: string, cancelerName: string, lessonId: string) {
    await createNotification(
        userId,
        'lesson_cancelled',
        `${cancelerName} has cancelled the lesson.`,
        lessonId
    );
}

export async function notifyTeacherApproved(teacherId: string) {
    await createNotification(
        teacherId,
        'teacher_approved',
        'Your teacher account has been approved! You can now access all teacher features.',
    );
}

export async function markNotificationAsRead(notificationId: string) {
    await db.notifications.update(notificationId, { read: true });
}

export async function markAllNotificationsAsRead(userId: string) {
    await db.notifications
        .where('userId')
        .equals(userId)
        .modify({ read: true });
}

export async function deleteNotification(notificationId: string) {
    await db.notifications.delete(notificationId);
}

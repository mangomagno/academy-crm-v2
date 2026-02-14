'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Users, BookOpen, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty } from '@/components/ui/empty';
import { useCurrentUser, useRequireRole } from '@/hooks/use-auth';
import { useLessons, useSubscriptions, usePayments, useUsers } from '@/hooks/use-db';
import { notifyLessonConfirmed, notifyLessonCancelled } from '@/lib/notifications';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function DashboardPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['teacher']);
    const { user: currentUser, loading: userLoading } = useCurrentUser();
    const allLessons = useLessons(currentUser?.id);
    const subscriptions = useSubscriptions(undefined, currentUser?.id);
    const payments = usePayments(currentUser?.id);
    const users = useUsers();
    const t = useTranslations('dashboardTeacher');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    // Statistics
    const stats = useMemo(() => {
        if (!allLessons || !subscriptions || !payments) return null;

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const lessonsThisWeek = allLessons.filter(l => {
            const d = new Date(l.date);
            return d >= weekStart && d <= weekEnd && l.status !== 'cancelled';
        }).length;

        const pendingRequests = allLessons.filter(l => l.status === 'pending').length;

        const currentMonth = format(now, 'yyyy-MM');
        const monthlyEarnings = payments
            .filter(p => p.month === currentMonth)
            .reduce((sum, p) => sum + p.amount, 0);

        return {
            totalStudents: subscriptions.length,
            lessonsThisWeek,
            pendingRequests,
            monthlyEarnings,
        };
    }, [allLessons, subscriptions, payments]);

    // Today's lessons
    const todayLessons = useMemo(() => {
        if (!allLessons) return [];
        return allLessons
            .filter(l => isToday(new Date(l.date)) && l.status !== 'cancelled')
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [allLessons]);

    // Pending lesson requests
    const pendingLessons = useMemo(() => {
        if (!allLessons) return [];
        return allLessons.filter(l => l.status === 'pending');
    }, [allLessons]);

    // User map
    const userMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u]));
    }, [users]);

    const handleAccept = async (lessonId: string, studentId: string) => {
        try {
            await db.lessons.update(lessonId, { status: 'confirmed' });
            await notifyLessonConfirmed(studentId, currentUser?.name || '', lessonId);
            toast.success(t('accepted'));
        } catch {
            toast.error(t('acceptError'));
        }
    };

    const handleReject = async (lessonId: string, studentId: string) => {
        try {
            await db.lessons.update(lessonId, { status: 'rejected' });
            await notifyLessonCancelled(studentId, currentUser?.name || '', lessonId);
            toast.success(t('rejected'));
        } catch {
            toast.error(t('rejectError'));
        }
    };

    if (authLoading || userLoading || !stats) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalStudents')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('lessonsThisWeek')}</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.lessonsThisWeek}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('pendingRequests')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingRequests}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('monthlyEarnings')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.monthlyEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Schedule */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('todaySchedule')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {todayLessons.length === 0 ? (
                        <p className="text-muted-foreground">{t('noLessonsToday')}</p>
                    ) : (
                        <div className="space-y-3">
                            {todayLessons.map(lesson => {
                                const student = userMap.get(lesson.studentId);
                                return (
                                    <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">
                                                {t('lessonWith', { name: student?.name || '' })}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {lesson.startTime} - {lesson.endTime} • {t('duration', { count: lesson.duration })}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={
                                            lesson.status === 'confirmed'
                                                ? 'bg-green-500/10 text-green-600'
                                                : 'bg-yellow-500/10 text-yellow-600'
                                        }>
                                            {lesson.status}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('pendingLessonRequests')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {pendingLessons.length === 0 ? (
                        <p className="text-muted-foreground">{t('noPendingRequests')}</p>
                    ) : (
                        <div className="space-y-3">
                            {pendingLessons.map(lesson => {
                                const student = userMap.get(lesson.studentId);
                                return (
                                    <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">
                                                {t('lessonWith', { name: student?.name || '' })}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(lesson.date), 'PPP', { locale: dateFnsLocale })} • {lesson.startTime} - {lesson.endTime}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600"
                                                onClick={() => handleAccept(lesson.id, lesson.studentId)}
                                            >
                                                <CheckCircle className="mr-1 h-4 w-4" />
                                                {t('accepted').split(' ')[0]}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600"
                                                onClick={() => handleReject(lesson.id, lesson.studentId)}
                                            >
                                                <XCircle className="mr-1 h-4 w-4" />
                                                {t('rejected').split(' ')[0]}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Clock, X, History } from 'lucide-react';
import { useUpcomingLessons, useUsers } from '@/hooks/use-db';
import { useCurrentUser, useRequireRole } from '@/hooks/use-auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty } from '@/components/ui/empty';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import type { LessonStatus } from '@/types';

const STATUS_COLORS: Record<LessonStatus, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    confirmed: 'bg-green-500/10 text-green-600 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
    completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function LessonsPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['student']);
    const { user: currentUser, loading: userLoading } = useCurrentUser();
    const lessons = useUpcomingLessons(currentUser?.id, 'student');
    const users = useUsers();
    const t = useTranslations('lessons');
    const ts = useTranslations('status');
    const tc = useTranslations('common');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const userMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u]));
    }, [users]);

    const handleCancel = async (lessonId: string, teacherId: string) => {
        if (!currentUser) return;
        setCancellingId(lessonId);
        try {
            await db.lessons.update(lessonId, { status: 'cancelled' });

            await db.notifications.add({
                id: crypto.randomUUID(),
                userId: teacherId,
                type: 'lesson_cancelled',
                message: `${currentUser.name} cancelled their lesson`,
                read: false,
                relatedId: lessonId,
                createdAt: new Date(),
            });

            toast.success(t('cancelled'));
        } catch (error) {
            toast.error(t('cancelError'));
            console.error(error);
        } finally {
            setCancellingId(null);
        }
    };

    if (authLoading || userLoading || lessons === undefined || users === undefined) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('upcoming')}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/lessons/history">
                        <History className="mr-2 h-4 w-4" />
                        {t('viewHistory')}
                    </Link>
                </Button>
            </div>

            {lessons.length === 0 ? (
                <Empty>
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                    <div>
                        <h3 className="text-lg font-semibold">{t('noUpcoming')}</h3>
                        <p className="text-muted-foreground">{t('noUpcomingDesc')}</p>
                    </div>
                    <Button asChild className="mt-4">
                        <Link href="/my-teachers">{t('bookLesson')}</Link>
                    </Button>
                </Empty>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('upcoming')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('date')}</TableHead>
                                    <TableHead>{t('time')}</TableHead>
                                    <TableHead>{t('teacher')}</TableHead>
                                    <TableHead>{t('duration')}</TableHead>
                                    <TableHead>{ts('pending')}</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lessons.map(lesson => {
                                    const teacher = userMap.get(lesson.teacherId);
                                    const isCancelling = cancellingId === lesson.id;

                                    return (
                                        <TableRow key={lesson.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(lesson.date), 'PP', { locale: dateFnsLocale })}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    {lesson.startTime} - {lesson.endTime}
                                                </div>
                                            </TableCell>
                                            <TableCell>{teacher?.name || tc('unknownUser')}</TableCell>
                                            <TableCell>{tc('min', { count: lesson.duration })}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={STATUS_COLORS[lesson.status]}
                                                >
                                                    {ts(lesson.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isCancelling}
                                                        >
                                                            {isCancelling ? (
                                                                <Spinner className="h-4 w-4" />
                                                            ) : (
                                                                <>
                                                                    <X className="h-4 w-4 mr-1" />
                                                                    {tc('cancel')}
                                                                </>
                                                            )}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t('cancelConfirmTitle')}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t('cancelConfirmDesc')}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t('keepLesson')}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleCancel(lesson.id, lesson.teacherId)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {t('confirmCancel')}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

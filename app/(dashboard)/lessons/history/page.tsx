'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowLeft, History, Clock } from 'lucide-react';
import { useLessons, useUsers } from '@/hooks/use-db';
import { useCurrentUser, useRequireRole } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty } from '@/components/ui/empty';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export default function LessonHistoryPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['student']);
    const { user: currentUser, loading: userLoading } = useCurrentUser();
    const allLessons = useLessons(undefined, currentUser?.id);
    const users = useUsers();
    const t = useTranslations('lessonHistory');
    const tl = useTranslations('lessons');
    const ts = useTranslations('status');
    const tc = useTranslations('common');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    const pastLessons = useMemo(() => {
        if (!allLessons) return [];
        const now = new Date();
        return allLessons
            .filter(lesson => {
                const lessonDate = new Date(lesson.date);
                return (
                    lesson.status === 'completed' ||
                    lesson.status === 'cancelled' ||
                    lessonDate < now
                );
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allLessons]);

    const userMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u]));
    }, [users]);

    if (authLoading || userLoading || allLessons === undefined || users === undefined) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/lessons">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
            </div>

            {pastLessons.length === 0 ? (
                <Empty>
                    <History className="h-12 w-12 text-muted-foreground" />
                    <div>
                        <h3 className="text-lg font-semibold">{t('noHistory')}</h3>
                        <p className="text-muted-foreground">{t('noHistoryDesc')}</p>
                    </div>
                </Empty>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('pastLessons')}</CardTitle>
                        <CardDescription>
                            {t('lessonsInHistory', { count: pastLessons.length })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{tl('date')}</TableHead>
                                    <TableHead>{tl('time')}</TableHead>
                                    <TableHead>{tl('teacher')}</TableHead>
                                    <TableHead>{tl('duration')}</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>{tl('notes')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pastLessons.map(lesson => {
                                    const teacher = userMap.get(lesson.teacherId);

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
                                            <TableCell className="max-w-xs truncate">
                                                {lesson.notes || (
                                                    <span className="text-muted-foreground italic">—</span>
                                                )}
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

'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Users, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Empty } from '@/components/ui/empty';
import { useCurrentUser, useRequireRole } from '@/hooks/use-auth';
import { useLessons, useSubscriptions, useUsers } from '@/hooks/use-db';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function StudentsPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['teacher']);
    const { user: currentUser, loading: userLoading } = useCurrentUser();
    const subscriptions = useSubscriptions(undefined, currentUser?.id);
    const allLessons = useLessons(currentUser?.id);
    const users = useUsers();
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslations('students');
    const tc = useTranslations('common');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    const studentData = useMemo(() => {
        if (!subscriptions || !users || !allLessons) return [];

        const studentIds = subscriptions.map(s => s.studentId);
        const studentUsers = users.filter(u => studentIds.includes(u.id));

        return studentUsers
            .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(student => {
                const studentLessons = allLessons.filter(l => l.studentId === student.id);
                const lastLesson = studentLessons
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                return {
                    ...student,
                    totalLessons: studentLessons.length,
                    lastLessonDate: lastLesson ? new Date(lastLesson.date) : null,
                };
            });
    }, [subscriptions, users, allLessons, searchQuery]);

    if (authLoading || userLoading || subscriptions === undefined || users === undefined) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t('searchPlaceholder')}
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {studentData.length === 0 ? (
                <Empty>
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <div>
                        <h3 className="text-lg font-semibold">{searchQuery ? t('noSearchResults') : t('noStudents')}</h3>
                        {!searchQuery && (
                            <p className="text-muted-foreground">{t('noStudentsDesc')}</p>
                        )}
                    </div>
                </Empty>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {studentData.map(student => (
                        <Card key={student.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{student.name}</CardTitle>
                                <CardDescription>{student.email}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('totalLessons')}</span>
                                    <span className="font-medium">{student.totalLessons}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-muted-foreground">{t('lastLesson')}</span>
                                    <span className="font-medium">
                                        {student.lastLessonDate
                                            ? format(student.lastLessonDate, 'PP', { locale: dateFnsLocale })
                                            : t('noLessonsYet')}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

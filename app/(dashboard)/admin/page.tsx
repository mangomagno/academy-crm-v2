'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRequireRole } from '@/hooks/use-auth';
import {
    useUsers,
    useTeachers,
    useLessons,
    usePayments
} from '@/hooks/use-db';
import { db } from '@/lib/db';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    UserCheck,
    Calendar,
    DollarSign,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isSameMonth } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['admin']);
    const t = useTranslations('admin');
    const tc = useTranslations('common');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    const allUsers = useUsers();
    const pendingTeachers = useTeachers('pending');
    const allLessons = useLessons();
    const allPayments = usePayments();

    if (authLoading) {
        return <div className="p-8">{tc('loading')}</div>;
    }

    if (!isAuthorized) return null;

    const handleApproveTeacher = async (userId: string) => {
        try {
            await db.users.update(userId, { teacherStatus: 'approved' });
            toast.success(t('teacherApproved'));
        } catch {
            toast.error(t('teacherApproveError'));
        }
    };

    const handleRejectTeacher = async (userId: string) => {
        try {
            await db.users.update(userId, { teacherStatus: 'rejected' });
            toast.success(t('teacherRejected'));
        } catch {
            toast.error(t('teacherRejectError'));
        }
    };

    const totalStudents = allUsers?.filter(u => u.role === 'student').length || 0;
    const totalTeachers = allUsers?.filter(u => u.role === 'teacher' && u.teacherStatus === 'approved').length || 0;
    const now = new Date();
    const lessonsThisMonth = allLessons?.filter(l => isSameMonth(new Date(l.date), now)).length || 0;
    const totalRevenue = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const recentLessons = allLessons?.slice(-5).reverse() || [];

    const getUserName = (userId: string) => {
        return allUsers?.find(u => u.id === userId)?.name || tc('unknownUser');
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalStudents')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('approvedTeachers')}</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTeachers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('lessonsThisMonth')}</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lessonsThisMonth}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{t('pendingApprovals')}</CardTitle>
                        <CardDescription>{t('pendingApprovalsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingTeachers && pendingTeachers.length > 0 ? (
                                pendingTeachers.map((teacher) => (
                                    <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-semibold">{teacher.name}</p>
                                            <p className="text-xs text-muted-foreground">{teacher.email}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(teacher.createdAt), 'PPP', { locale: dateFnsLocale })}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-destructive hover:text-destructive"
                                                onClick={() => handleRejectTeacher(teacher.id)}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                {t('reject')}
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="h-8"
                                                onClick={() => handleApproveTeacher(teacher.id)}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                {t('approve')}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Clock className="h-10 w-10 text-muted-foreground/50 mb-4" />
                                    <p className="text-sm text-muted-foreground">{t('noPending')}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t('recentActivity')}</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/lessons">
                                {t('viewAll')} <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentLessons.length > 0 ? (
                                recentLessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-start space-x-4">
                                        <div className="mt-1 bg-primary/10 p-1 rounded-full text-primary">
                                            <Calendar className="h-3 w-3" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {t('newLessonBooked')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {getUserName(lesson.studentId)} – {getUserName(lesson.teacherId)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {format(new Date(lesson.createdAt), 'PPp', { locale: dateFnsLocale })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground py-4 text-center">{t('noActivity')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

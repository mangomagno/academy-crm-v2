'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Users, DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useCurrentUser, useRequireRole } from '@/hooks/use-auth';
import { usePayments, useLessons, useUsers } from '@/hooks/use-db';
import { EarningsChart } from '@/components/earnings-chart';
import { BillingTable } from '@/components/billing-table';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function FinancePage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['teacher']);
    const { user: currentUser, loading: userLoading } = useCurrentUser();
    const payments = usePayments(currentUser?.id);
    const lessons = useLessons(currentUser?.id);
    const users = useUsers();
    const t = useTranslations('finance');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    const stats = useMemo(() => {
        if (!payments) return null;

        const totalEarnings = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);

        const outstanding = payments
            .filter(p => p.status === 'unpaid')
            .reduce((sum, p) => sum + p.amount, 0);

        const currentMonth = format(new Date(), 'yyyy-MM');
        const thisMonth = payments
            .filter(p => p.month === currentMonth)
            .reduce((sum, p) => sum + p.amount, 0);

        const billedStudentIds = new Set(payments.map(p => p.studentId));

        return {
            totalEarnings,
            outstanding,
            billedStudents: billedStudentIds.size,
            thisMonth,
        };
    }, [payments]);

    if (authLoading || userLoading || !stats) {
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalEarnings')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('outstanding')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.outstanding.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('billedStudents')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.billedStudents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('thisMonth')}</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.thisMonth.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {payments && <EarningsChart payments={payments} />}
            {payments && lessons && users && (
                <BillingTable payments={payments} lessons={lessons} users={users} teacherId={currentUser?.id || ''} />
            )}
        </div>
    );
}

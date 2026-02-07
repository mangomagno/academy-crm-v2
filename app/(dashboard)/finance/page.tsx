'use client';

import { useState, useMemo } from 'react';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { EarningsChart } from '@/components/earnings-chart';
import { BillingTable } from '@/components/billing-table';
import { useCurrentUser, useRequireApprovedTeacher } from '@/hooks/use-auth';
import { usePayments, useLessons, useStudents } from '@/hooks/use-db';
import { Landmark, Users, Receipt, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancePage() {
    const { loading: authLoading } = useRequireApprovedTeacher();
    const { user } = useCurrentUser();
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

    const teacherId = user?.id;
    const payments = usePayments(teacherId);
    const lessons = useLessons(teacherId);
    const students = useStudents();

    // Generate last 12 months for the selector
    const monthOptions = useMemo(() => {
        const end = new Date();
        const start = subMonths(end, 11);
        return eachMonthOfInterval({ start, end })
            .reverse()
            .map((date) => ({
                value: format(date, 'yyyy-MM'),
                label: format(date, 'MMMM yyyy'),
            }));
    }, []);

    const monthPayments = useMemo(() => {
        if (!payments) return [];
        return payments.filter((p) => p.month === selectedMonth);
    }, [payments, selectedMonth]);

    const stats = useMemo(() => {
        const paid = monthPayments
            .filter((p) => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);
        const unpaid = monthPayments
            .filter((p) => p.status === 'unpaid')
            .reduce((sum, p) => sum + p.amount, 0);
        const studentCount = new Set(monthPayments.map((p) => p.studentId)).size;

        return {
            paid,
            unpaid,
            total: paid + unpaid,
            studentCount,
        };
    }, [monthPayments]);

    if (authLoading || !payments || !lessons || !students) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-40" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[300px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
                    <p className="text-muted-foreground">
                        Manage your earnings and student billing
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.paid.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Received in {format(new Date(selectedMonth + '-01'), 'MMMM')}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            ${stats.unpaid.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            To be collected
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Billed Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.studentCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Active billable accounts
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-6">
                <div className="md:col-span-4">
                    <EarningsChart payments={payments} />
                </div>
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg bg-muted p-4">
                            <div className="flex items-center gap-2 font-medium">
                                <Receipt className="h-4 w-4" />
                                Monthly Summary
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Total for this month: ${stats.total.toFixed(2)}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Use the billing table below to track individual student payments.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="mb-4 text-xl font-semibold">Student Billing</h2>
                <BillingTable
                    payments={monthPayments}
                    students={students}
                    lessons={lessons}
                    month={format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
                />
            </div>
        </div>
    );
}

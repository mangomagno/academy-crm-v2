'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import type { Payment, User, Lesson } from '@/types';
import { toast } from 'sonner';

interface BillingTableProps {
    payments: Payment[];
    users: User[];
    lessons: Lesson[];
    teacherId: string;
}

export function BillingTable({ payments, users, lessons, teacherId }: BillingTableProps) {
    const t = useTranslations('billingTable');
    const tc = useTranslations('common');

    const billingData = useMemo(() => {
        const studentMap = new Map<string, {
            studentName: string;
            lessonCount: number;
            totalDuration: number;
            amountDue: number;
            paymentIds: string[];
            isPaid: boolean;
        }>();

        payments.forEach((p) => {
            const student = users.find((s: User) => s.id === p.studentId);
            const lesson = lessons.find((l) => l.id === p.lessonId);

            const existing = studentMap.get(p.studentId) || {
                studentName: student?.name || tc('unknownStudent'),
                lessonCount: 0,
                totalDuration: 0,
                amountDue: 0,
                paymentIds: [],
                isPaid: true,
            };

            existing.lessonCount += 1;
            existing.totalDuration += lesson?.duration || 0;
            existing.amountDue += p.amount;
            existing.paymentIds.push(p.id);
            if (p.status === 'unpaid') {
                existing.isPaid = false;
            }

            studentMap.set(p.studentId, existing);
        });

        return Array.from(studentMap.values());
    }, [payments, users, lessons, tc]);

    const handleToggleStatus = async (paymentIds: string[], currentStatus: boolean) => {
        try {
            const newStatus = currentStatus ? 'unpaid' : 'paid';
            await Promise.all(paymentIds.map((id) => db.updatePaymentStatus(id, newStatus)));
            toast.success(currentStatus ? t('markUnpaid') : t('markPaid'));
        } catch (error) {
            console.error('Failed to update payment status:', error);
            toast.error(tc('noResults'));
        }
    };

    if (billingData.length === 0) {
        return (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
                {t('noBilling')}
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('student')}</TableHead>
                        <TableHead>{t('lessons')}</TableHead>
                        <TableHead>{t('totalDuration')}</TableHead>
                        <TableHead>{t('amount')}</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px] text-right">{t('paid')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {billingData.map((row) => (
                        <TableRow key={row.studentName}>
                            <TableCell className="font-medium">{row.studentName}</TableCell>
                            <TableCell>{row.lessonCount}</TableCell>
                            <TableCell>{tc('min', { count: row.totalDuration })}</TableCell>
                            <TableCell>${row.amountDue.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={row.isPaid ? 'default' : 'secondary'}>
                                    {row.isPaid ? t('paid') : t('unpaid')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Checkbox
                                    checked={row.isPaid}
                                    onCheckedChange={() => handleToggleStatus(row.paymentIds, row.isPaid)}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

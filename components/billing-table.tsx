'use client';

import { useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import type { Payment, User, Lesson } from '@/types';
import { toast } from 'sonner';

interface BillingTableProps {
    payments: Payment[];
    students: User[];
    lessons: Lesson[];
    month: string;
}

export function BillingTable({ payments, students, lessons, month }: BillingTableProps) {
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
            const student = students.find((s) => s.id === p.studentId);
            const lesson = lessons.find((l) => l.id === p.lessonId);

            const existing = studentMap.get(p.studentId) || {
                studentName: student?.name || 'Unknown Student',
                lessonCount: 0,
                totalDuration: 0,
                amountDue: 0,
                paymentIds: [],
                isPaid: true, // We'll set to false if any payment is unpaid
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
    }, [payments, students, lessons]);

    const handleToggleStatus = async (paymentIds: string[], currentStatus: boolean) => {
        try {
            const newStatus = currentStatus ? 'unpaid' : 'paid';
            await Promise.all(paymentIds.map((id) => db.updatePaymentStatus(id, newStatus)));
            toast.success(`Marked as ${newStatus}`);
        } catch (error) {
            console.error('Failed to update payment status:', error);
            toast.error('Failed to update payment status');
        }
    };

    if (billingData.length === 0) {
        return (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-muted-foreground">
                No billing data for {month}
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Lessons</TableHead>
                        <TableHead>Total Duration</TableHead>
                        <TableHead>Amount Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px] text-right">Paid</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {billingData.map((row) => (
                        <TableRow key={row.studentName}>
                            <TableCell className="font-medium">{row.studentName}</TableCell>
                            <TableCell>{row.lessonCount}</TableCell>
                            <TableCell>{row.totalDuration} mins</TableCell>
                            <TableCell>${row.amountDue.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={row.isPaid ? 'default' : 'secondary'}>
                                    {row.isPaid ? 'Paid' : 'Unpaid'}
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

'use client';

import * as React from 'react';
import { useRequireRole } from '@/hooks/use-auth';
import { useUsers, usePayments } from '@/hooks/use-db';
import type { PaymentStatus } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Search,
    User,
    GraduationCap,
    FilterX
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPaymentsPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['admin']);
    const allUsers = useUsers();
    const allPayments = usePayments();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string>('all');
    const [teacherFilter, setTeacherFilter] = React.useState<string>('all');
    const [studentFilter, setStudentFilter] = React.useState<string>('all');
    const [monthFilter, setMonthFilter] = React.useState<string>('all');

    if (authLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!isAuthorized) {
        return null;
    }

    const teachers = allUsers?.filter(u => u.role === 'teacher') || [];
    // Extract unique months from payments
    const uniqueMonths = Array.from(new Set(allPayments?.map(p => p.month) || [])).sort().reverse();

    const filteredPayments = allPayments?.filter(payment => {
        const teacherName = allUsers?.find(u => u.id === payment.teacherId)?.name || '';
        const studentName = allUsers?.find(u => u.id === payment.studentId)?.name || '';

        const matchesSearch =
            teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            studentName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
        const matchesTeacher = teacherFilter === 'all' || payment.teacherId === teacherFilter;
        const matchesStudent = studentFilter === 'all' || payment.studentId === studentFilter;
        const matchesMonth = monthFilter === 'all' || payment.month === monthFilter;

        return matchesSearch && matchesStatus && matchesTeacher && matchesStudent && matchesMonth;
    });

    const getUserName = (userId: string) => {
        return allUsers?.find(u => u.id === userId)?.name || 'Unknown User';
    };

    const getStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
            case 'unpaid':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Unpaid</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTeacherFilter('all');
        setStudentFilter('all');
        setMonthFilter('all');
    };

    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy');
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">All Payments</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Global Payment Logs</CardTitle>
                    <CardDescription>
                        Track all student-to-teacher payments across the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by teacher or student..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Select value={monthFilter} onValueChange={setMonthFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Months</SelectItem>
                                        {uniqueMonths.map(m => (
                                            <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="unpaid">Unpaid</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Teachers</SelectItem>
                                        {teachers.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button variant="ghost" size="icon" onClick={resetFilters} title="Reset Filters">
                                    <FilterX className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Paid At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments && filteredPayments.length > 0 ? (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                {formatMonth(payment.month)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <GraduationCap className="h-3 w-3 text-primary/60" />
                                                    <span className="text-sm">{getUserName(payment.teacherId)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm">{getUserName(payment.studentId)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                ${payment.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(payment.status)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {payment.paidAt ? format(new Date(payment.paidAt), 'MMM d, yyyy') : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No payments found matching your filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRequireRole } from '@/hooks/use-auth';
import { useUsers, useLessons } from '@/hooks/use-db';
import type { LessonStatus } from '@/types';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, User, GraduationCap, FilterX, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function AdminLessonsPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['admin']);
    const allUsers = useUsers();
    const allLessons = useLessons();
    const t = useTranslations('admin');
    const ts = useTranslations('status');
    const tc = useTranslations('common');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string>('all');
    const [teacherFilter, setTeacherFilter] = React.useState<string>('all');
    const [studentFilter, setStudentFilter] = React.useState<string>('all');

    if (authLoading) {
        return <div className="p-8">{tc('loading')}</div>;
    }

    if (!isAuthorized) return null;

    const teachers = allUsers?.filter(u => u.role === 'teacher') || [];
    const students = allUsers?.filter(u => u.role === 'student') || [];

    const filteredLessons = allLessons?.filter(lesson => {
        const teacherName = allUsers?.find(u => u.id === lesson.teacherId)?.name || '';
        const studentName = allUsers?.find(u => u.id === lesson.studentId)?.name || '';

        const matchesSearch =
            teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            studentName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
        const matchesTeacher = teacherFilter === 'all' || lesson.teacherId === teacherFilter;
        const matchesStudent = studentFilter === 'all' || lesson.studentId === studentFilter;

        return matchesSearch && matchesStatus && matchesTeacher && matchesStudent;
    });

    const getUserName = (userId: string) => {
        return allUsers?.find(u => u.id === userId)?.name || tc('unknownUser');
    };

    const getStatusBadge = (status: LessonStatus) => {
        const label = ts(status);
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-green-100 text-green-800 border-green-200">{label}</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{label}</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800 border-red-200">{label}</Badge>;
            case 'completed':
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{label}</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTeacherFilter('all');
        setStudentFilter('all');
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">{t('allLessons')}</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('lessonSchedule')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={tc('search')}
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[130px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allStatus')}</SelectItem>
                                        <SelectItem value="pending">{ts('pending')}</SelectItem>
                                        <SelectItem value="confirmed">{ts('confirmed')}</SelectItem>
                                        <SelectItem value="completed">{ts('completed')}</SelectItem>
                                        <SelectItem value="cancelled">{ts('cancelled')}</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allTeachers')}</SelectItem>
                                        {teachers.map(teacher => (
                                            <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={studentFilter} onValueChange={setStudentFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('allStudents')}</SelectItem>
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button variant="ghost" size="icon" onClick={resetFilters}>
                                    <FilterX className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('dateTime')}</TableHead>
                                    <TableHead>{t('teacherCol')}</TableHead>
                                    <TableHead>{t('studentCol')}</TableHead>
                                    <TableHead>{t('durationCol')}</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLessons && filteredLessons.length > 0 ? (
                                    filteredLessons.map((lesson) => (
                                        <TableRow key={lesson.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{format(new Date(lesson.date), 'PP', { locale: dateFnsLocale })}</span>
                                                    <span className="text-xs text-muted-foreground">{lesson.startTime} - {lesson.endTime}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <GraduationCap className="h-3 w-3 text-primary/60" />
                                                    <span className="text-sm">{getUserName(lesson.teacherId)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-sm">{getUserName(lesson.studentId)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{tc('min', { count: lesson.duration })}</span>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(lesson.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            {t('noResults')}
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

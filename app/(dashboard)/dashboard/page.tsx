'use client';

import * as React from 'react';
import {
    useCurrentUser,
    useRequireApprovedTeacher
} from '@/hooks/use-auth';
import {
    useTodaysLessons,
    usePendingLessons,
    useSubscriptions,
    useUsers
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
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    CalendarDays,
    DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TeacherDashboardPage() {
    const { isApproved, loading: authLoading } = useRequireApprovedTeacher();
    const { user } = useCurrentUser();
    const allUsers = useUsers();

    const todaysLessons = useTodaysLessons(user?.id);
    const pendingLessons = usePendingLessons(user?.id);
    const subscriptions = useSubscriptions(undefined, user?.id);

    if (authLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!isApproved) {
        return null; // Hook will redirect
    }

    const handleAcceptLesson = async (lessonId: string) => {
        try {
            await db.lessons.update(lessonId, { status: 'confirmed' });
            toast.success('Lesson request accepted');
        } catch {
            toast.error('Failed to accept lesson');
        }
    };

    const handleRejectLesson = async (lessonId: string) => {
        try {
            await db.lessons.update(lessonId, { status: 'rejected' });
            toast.success('Lesson request rejected');
        } catch {
            toast.error('Failed to reject lesson');
        }
    };

    const getStudentName = (studentId: string) => {
        return allUsers?.find(u => u.id === studentId)?.name || 'Unknown Student';
    };

    // Calculate stats
    const totalStudents = subscriptions?.length || 0;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                        <p className="text-xs text-muted-foreground">
                            Subscribed to your profile
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lessons This Week</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todaysLessons?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Lessons scheduled this week
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingLessons?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Waitng for your approval
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                        <p className="text-xs text-muted-foreground">
                            Estimated for current month
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Today's Schedule */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Today&apos;s Schedule</CardTitle>
                        <CardDescription>
                            {format(new Date(), 'EEEE, MMMM do')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {todaysLessons && todaysLessons.length > 0 ? (
                                todaysLessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-primary/10 p-2 rounded-full text-primary">
                                                <CalendarDays className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{getStudentName(lesson.studentId)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {lesson.startTime} - {lesson.endTime} ({lesson.duration} mins)
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={lesson.status === 'confirmed' ? 'default' : 'secondary'}>
                                            {lesson.status}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground py-4 text-center">No lessons scheduled for today.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Requests */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Pending Requests</CardTitle>
                        <CardDescription>
                            Confirm or reject new lesson bookings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {pendingLessons && pendingLessons.length > 0 ? (
                                pendingLessons.map((lesson) => (
                                    <div key={lesson.id} className="flex flex-col space-y-3 p-3 border rounded-lg bg-muted/30">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-semibold">{getStudentName(lesson.studentId)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(lesson.date), 'MMM d, yyyy')}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {lesson.startTime} - {lesson.endTime}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                New
                                            </Badge>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleAcceptLesson(lesson.id)}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 text-destructive hover:text-destructive"
                                                onClick={() => handleRejectLesson(lesson.id)}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground py-4 text-center">No pending requests.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

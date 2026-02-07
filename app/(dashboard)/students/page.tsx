'use client';

import * as React from 'react';
import {
    useCurrentUser,
    useRequireApprovedTeacher
} from '@/hooks/use-auth';
import {
    useSubscriptions,
    useUsers,
    useLessons
} from '@/hooks/use-db';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Search,
    Mail,
    Calendar,
    User as UserIcon
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function MyStudentsPage() {
    const { isApproved, loading: authLoading } = useRequireApprovedTeacher();
    const { user: teacher } = useCurrentUser();
    const [searchQuery, setSearchQuery] = React.useState('');

    const subscriptions = useSubscriptions(undefined, teacher?.id);
    const allUsers = useUsers();
    const allLessons = useLessons(teacher?.id);

    if (authLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!isApproved) {
        return null;
    }

    const students = subscriptions?.map(sub => {
        const studentUser = allUsers?.find(u => u.id === sub.studentId);
        const studentLessons = allLessons?.filter(l => l.studentId === sub.studentId) || [];

        return {
            ...studentUser,
            subscriptionId: sub.id,
            totalLessons: studentLessons.length,
            lastLesson: studentLessons.length > 0 ? studentLessons[studentLessons.length - 1] : null,
        };
    }).filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">My Students</h2>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {students?.map((student) => (
                    <Card key={student.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center space-x-4 pb-4">
                            <Avatar className="h-12 w-12 border-2 border-primary/10">
                                <AvatarFallback className="bg-primary/5 text-primary">
                                    {student.name?.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <CardTitle className="text-lg">{student.name}</CardTitle>
                                <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                                    <Mail className="mr-1 h-3 w-3" />
                                    {student.email}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="bg-muted/30 pt-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Lessons</p>
                                    <div className="flex items-center">
                                        <Badge variant="secondary" className="font-bold">
                                            {student.totalLessons}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Status</p>
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                        Active
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex space-x-2 pt-2 border-t">
                                <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                                    <Link href={`/lessons?studentId=${student.id}`}>
                                        <Calendar className="mr-2 h-3 w-3" />
                                        History
                                    </Link>
                                </Button>
                                <Button size="sm" className="flex-1 text-xs" asChild>
                                    <Link href={`/notifications?userId=${student.id}`}>
                                        <Mail className="mr-2 h-3 w-3" />
                                        Contact
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {students?.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/5">
                        <UserIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">No students found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search or wait for students to subscribe.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

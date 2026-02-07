'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Calendar, UserMinus } from 'lucide-react';
import { useSubscriptions, useUsers, useTeacherProfiles } from '@/hooks/use-db';
import { useCurrentUser, useRequireRole } from '@/hooks/use-auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty } from '@/components/ui/empty';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function MyTeachersPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['student']);
    const { user: currentUser, loading: userLoading } = useCurrentUser();
    const subscriptions = useSubscriptions(currentUser?.id);
    const users = useUsers();
    const profiles = useTeacherProfiles();

    const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);

    // Create maps for quick lookup
    const userMap = useMemo(() => {
        if (!users) return new Map();
        return new Map(users.map(u => [u.id, u]));
    }, [users]);

    const profileMap = useMemo(() => {
        if (!profiles) return new Map();
        return new Map(profiles.map(p => [p.userId, p]));
    }, [profiles]);

    const handleUnsubscribe = async (teacherId: string) => {
        if (!currentUser) return;
        setUnsubscribingId(teacherId);
        try {
            await db.subscriptions
                .where('[studentId+teacherId]')
                .equals([currentUser.id, teacherId])
                .delete();
            toast.success('Unsubscribed successfully');
        } catch (error) {
            toast.error('Failed to unsubscribe');
            console.error(error);
        } finally {
            setUnsubscribingId(null);
        }
    };

    if (authLoading || userLoading || subscriptions === undefined || users === undefined || profiles === undefined) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Teachers</h1>
                <p className="text-muted-foreground">
                    Teachers you&apos;re subscribed to
                </p>
            </div>

            {subscriptions.length === 0 ? (
                <Empty>
                    <GraduationCap className="h-12 w-12 text-muted-foreground" />
                    <div>
                        <h3 className="text-lg font-semibold">No subscriptions yet</h3>
                        <p className="text-muted-foreground">Browse teachers and subscribe to start booking lessons.</p>
                    </div>
                    <Button asChild className="mt-4">
                        <Link href="/teachers">Browse Teachers</Link>
                    </Button>
                </Empty>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {subscriptions.map(subscription => {
                        const teacher = userMap.get(subscription.teacherId);
                        const profile = profileMap.get(subscription.teacherId);

                        if (!teacher) return null;

                        const initials = teacher.name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                        const isUnsubscribing = unsubscribingId === subscription.teacherId;

                        return (
                            <Card key={subscription.id} className="flex flex-col">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{teacher.name}</h3>
                                        {profile && (
                                            <Badge variant="secondary" className="mt-1">
                                                ${profile.hourlyRate}/hr
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    {profile?.lessonDurations && profile.lessonDurations.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {profile.lessonDurations.map((duration: number) => (
                                                <Badge key={duration} variant="outline" className="text-xs">
                                                    {duration} min
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button asChild className="flex-1">
                                        <Link href={`/book/${subscription.teacherId}`}>
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Book Lesson
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="icon" disabled={isUnsubscribing}>
                                                {isUnsubscribing ? (
                                                    <Spinner className="h-4 w-4" />
                                                ) : (
                                                    <UserMinus className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Unsubscribe from {teacher.name}?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    You will no longer be able to book lessons with this teacher.
                                                    You can resubscribe at any time from the teacher&apos;s profile.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleUnsubscribe(subscription.teacherId)}
                                                >
                                                    Unsubscribe
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

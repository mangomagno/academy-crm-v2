'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, DollarSign, Calendar, UserPlus, UserMinus } from 'lucide-react';
import { useUserById, useTeacherProfile, useAvailability, useIsSubscribed } from '@/hooks/use-db';
import { useCurrentUser, useRequireRole } from '@/hooks/use-auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: teacherId } = use(params);
    const router = useRouter();
    const [isSubscribing, setIsSubscribing] = useState(false);

    const { isAuthorized, loading: authLoading } = useRequireRole(['student']);
    const { user: currentUser } = useCurrentUser();
    const teacher = useUserById(teacherId);
    const profile = useTeacherProfile(teacherId);
    const availability = useAvailability(teacherId);
    const isSubscribed = useIsSubscribed(currentUser?.id, teacherId);

    // Group availability by day of week
    const availabilityByDay = useMemo(() => {
        if (!availability) return new Map<number, { startTime: string; endTime: string }[]>();
        const map = new Map<number, { startTime: string; endTime: string }[]>();
        availability.forEach(slot => {
            const existing = map.get(slot.dayOfWeek) || [];
            existing.push({ startTime: slot.startTime, endTime: slot.endTime });
            map.set(slot.dayOfWeek, existing.sort((a, b) => a.startTime.localeCompare(b.startTime)));
        });
        return map;
    }, [availability]);

    const handleSubscribe = async () => {
        if (!currentUser) return;
        setIsSubscribing(true);
        try {
            await db.subscriptions.add({
                id: crypto.randomUUID(),
                studentId: currentUser.id,
                teacherId,
                createdAt: new Date(),
            });
            toast.success('Subscribed successfully!');
        } catch (error) {
            toast.error('Failed to subscribe');
            console.error(error);
        } finally {
            setIsSubscribing(false);
        }
    };

    const handleUnsubscribe = async () => {
        if (!currentUser) return;
        setIsSubscribing(true);
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
            setIsSubscribing(false);
        }
    };

    if (authLoading || teacher === undefined || profile === undefined || availability === undefined) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    // Check if teacher exists and is approved
    if (!teacher || teacher.role !== 'teacher' || teacher.teacherStatus !== 'approved') {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold">Teacher not found</h2>
                    <p className="text-muted-foreground mt-2">
                        This teacher profile is not available.
                    </p>
                </div>
            </div>
        );
    }

    const initials = teacher.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>

            {/* Teacher Header */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">{teacher.name}</h1>
                    <div className="flex flex-wrap gap-2">
                        {profile && (
                            <Badge variant="secondary" className="text-sm">
                                <DollarSign className="h-3 w-3 mr-1" />
                                ${profile.hourlyRate}/hr
                            </Badge>
                        )}
                        {profile?.lessonDurations?.map(duration => (
                            <Badge key={duration} variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {duration} min
                            </Badge>
                        ))}
                    </div>
                </div>
                <Button
                    onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                    disabled={isSubscribing}
                    variant={isSubscribed ? 'outline' : 'default'}
                    size="lg"
                >
                    {isSubscribing ? (
                        <Spinner className="h-4 w-4 mr-2" />
                    ) : isSubscribed ? (
                        <UserMinus className="h-4 w-4 mr-2" />
                    ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                </Button>
            </div>

            {/* Bio */}
            <Card>
                <CardHeader>
                    <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                    {profile?.bio ? (
                        <p className="whitespace-pre-wrap">{profile.bio}</p>
                    ) : (
                        <p className="text-muted-foreground italic">No bio available</p>
                    )}
                </CardContent>
            </Card>

            {/* Weekly Availability */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Weekly Availability
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {availability.length === 0 ? (
                        <p className="text-muted-foreground italic">No availability set</p>
                    ) : (
                        <div className="grid gap-2">
                            {DAYS_OF_WEEK.map((day, index) => {
                                const slots = availabilityByDay.get(index);
                                return (
                                    <div key={day} className="flex items-center gap-4 py-2 border-b last:border-0">
                                        <span className="font-medium w-24">{day}</span>
                                        {slots && slots.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {slots.map((slot, i) => (
                                                    <Badge key={i} variant="secondary">
                                                        {slot.startTime} - {slot.endTime}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Unavailable</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

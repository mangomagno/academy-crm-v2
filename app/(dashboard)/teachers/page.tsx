'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useTeachers, useTeacherProfiles } from '@/hooks/use-db';
import { useRequireRole } from '@/hooks/use-auth';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Empty } from '@/components/ui/empty';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function TeachersPage() {
    const { isAuthorized, loading: authLoading } = useRequireRole(['student']);
    const teachers = useTeachers('approved');
    const profiles = useTeacherProfiles();

    // Create a map of teacher profiles by userId for quick lookup
    const profileMap = useMemo(() => {
        if (!profiles) return new Map();
        return new Map(profiles.map(p => [p.userId, p]));
    }, [profiles]);

    if (authLoading || teachers === undefined || profiles === undefined) {
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
                <h1 className="text-3xl font-bold tracking-tight">Browse Teachers</h1>
                <p className="text-muted-foreground">
                    Find and subscribe to music teachers
                </p>
            </div>

            {teachers.length === 0 ? (
                <Empty>
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <div>
                        <h3 className="text-lg font-semibold">No teachers available</h3>
                        <p className="text-muted-foreground">There are no approved teachers at the moment. Please check back later.</p>
                    </div>
                </Empty>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {teachers.map(teacher => {
                        const profile = profileMap.get(teacher.id);
                        const initials = teacher.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);

                        return (
                            <Card key={teacher.id} className="flex flex-col">
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
                                    {profile?.bio ? (
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {profile.bio}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">
                                            No bio available
                                        </p>
                                    )}
                                    {profile?.lessonDurations && profile.lessonDurations.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {profile.lessonDurations.map((duration: number) => (
                                                <Badge key={duration} variant="outline" className="text-xs">
                                                    {duration} min
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={`/teachers/${teacher.id}`}>
                                            View Profile
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

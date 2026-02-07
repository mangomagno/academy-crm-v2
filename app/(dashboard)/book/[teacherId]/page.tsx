'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Check, ChevronRight } from 'lucide-react';
import { useUserById, useTeacherProfile, useAvailability, useBlockedSlots, useLessons, useIsSubscribed } from '@/hooks/use-db';
import { useCurrentUser, useRequireRole } from '@/hooks/use-auth';
import { db } from '@/lib/db';
import {
    getAvailableSlots,
    hasAvailableSlots,
    formatDate,
    getMonthString,
} from '@/lib/booking-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { LessonStatus } from '@/types';

type BookingStep = 'date' | 'time' | 'duration' | 'confirm';

export default function BookLessonPage({ params }: { params: Promise<{ teacherId: string }> }) {
    const { teacherId } = use(params);
    const router = useRouter();

    const { isAuthorized, loading: authLoading } = useRequireRole(['student']);
    const { user: currentUser } = useCurrentUser();
    const teacher = useUserById(teacherId);
    const profile = useTeacherProfile(teacherId);
    const availability = useAvailability(teacherId);
    const blockedSlots = useBlockedSlots(teacherId);
    const lessons = useLessons(teacherId);
    const isSubscribed = useIsSubscribed(currentUser?.id, teacherId);

    const [step, setStep] = useState<BookingStep>('date');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<{ startTime: string; endTime: string } | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Available time slots for selected date and duration
    const availableSlots = useMemo(() => {
        if (!selectedDate || !selectedDuration || !availability || !blockedSlots || !lessons) {
            return [];
        }
        return getAvailableSlots(selectedDate, availability, blockedSlots, lessons, selectedDuration);
    }, [selectedDate, selectedDuration, availability, blockedSlots, lessons]);

    // Calculate price
    const price = useMemo(() => {
        if (!profile || !selectedDuration) return 0;
        return (selectedDuration / 60) * profile.hourlyRate;
    }, [profile, selectedDuration]);

    // Date disabled check for calendar
    const isDateDisabled = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Past dates
        if (date < today) return true;

        // Check if date has any availability
        if (!availability || !blockedSlots || !lessons || !profile?.lessonDurations) return true;

        return !hasAvailableSlots(date, availability, blockedSlots, lessons, profile.lessonDurations);
    };

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
        setSelectedTime(null);
        if (date) {
            setStep('duration');
        }
    };

    const handleDurationSelect = (duration: number) => {
        setSelectedDuration(duration);
        setSelectedTime(null);
        setStep('time');
    };

    const handleTimeSelect = (slot: { startTime: string; endTime: string }) => {
        setSelectedTime(slot);
        setStep('confirm');
    };

    const handleConfirm = async () => {
        if (!currentUser || !selectedDate || !selectedTime || !selectedDuration || !profile) {
            return;
        }

        setIsSubmitting(true);
        try {
            const lessonId = crypto.randomUUID();
            const lessonStatus: LessonStatus = profile.autoAccept ? 'confirmed' : 'pending';

            // Create the lesson
            await db.lessons.add({
                id: lessonId,
                teacherId,
                studentId: currentUser.id,
                date: selectedDate,
                startTime: selectedTime.startTime,
                endTime: selectedTime.endTime,
                duration: selectedDuration,
                status: lessonStatus,
                notes: notes || undefined,
                createdAt: new Date(),
            });

            // Create payment record
            await db.payments.add({
                id: crypto.randomUUID(),
                lessonId,
                teacherId,
                studentId: currentUser.id,
                amount: price,
                status: 'unpaid',
                month: getMonthString(selectedDate),
            });

            // Create notification for teacher
            await db.notifications.add({
                id: crypto.randomUUID(),
                userId: teacherId,
                type: 'lesson_request',
                message: `New lesson request from ${currentUser.name} on ${formatDate(selectedDate)} at ${selectedTime.startTime}`,
                read: false,
                relatedId: lessonId,
                createdAt: new Date(),
            });

            toast.success(
                lessonStatus === 'confirmed'
                    ? 'Lesson booked successfully!'
                    : 'Lesson request sent! Awaiting teacher confirmation.'
            );
            router.push('/lessons');
        } catch (error) {
            toast.error('Failed to book lesson');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const goBack = () => {
        if (step === 'time') {
            setStep('duration');
            setSelectedTime(null);
        } else if (step === 'duration') {
            setStep('date');
            setSelectedDuration(null);
        } else if (step === 'confirm') {
            setStep('time');
        }
    };

    if (authLoading || teacher === undefined || profile === undefined ||
        availability === undefined || blockedSlots === undefined || lessons === undefined) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    // Check if teacher exists and student is subscribed
    if (!teacher || !isSubscribed) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold">Cannot book lesson</h2>
                    <p className="text-muted-foreground mt-2">
                        {!teacher
                            ? 'Teacher not found.'
                            : 'You need to subscribe to this teacher first.'}
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/teachers">Browse Teachers</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Book Lesson</h1>
                    <p className="text-muted-foreground">with {teacher.name}</p>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 text-sm">
                {(['date', 'duration', 'time', 'confirm'] as BookingStep[]).map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${step === s
                                ? 'bg-primary text-primary-foreground'
                                : ['date', 'duration', 'time', 'confirm'].indexOf(step) > i
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {['date', 'duration', 'time', 'confirm'].indexOf(step) > i ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                i + 1
                            )}
                        </div>
                        {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Date Selection */}
            {step === 'date' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Select a Date
                        </CardTitle>
                        <CardDescription>Choose a date for your lesson</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={isDateDisabled}
                            fromDate={new Date()}
                            className="rounded-md border"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Duration Selection */}
            {step === 'duration' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Select Duration
                        </CardTitle>
                        <CardDescription>
                            {selectedDate && formatDate(selectedDate)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {profile?.lessonDurations?.map(duration => (
                            <Button
                                key={duration}
                                variant={selectedDuration === duration ? 'default' : 'outline'}
                                className="w-full justify-between h-auto py-4"
                                onClick={() => handleDurationSelect(duration)}
                            >
                                <span className="font-medium">{duration} minutes</span>
                                <Badge variant="secondary">
                                    ${((duration / 60) * (profile.hourlyRate || 0)).toFixed(2)}
                                </Badge>
                            </Button>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" onClick={goBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 3: Time Selection */}
            {step === 'time' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Select Time
                        </CardTitle>
                        <CardDescription>
                            {selectedDate && formatDate(selectedDate)} • {selectedDuration} min
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {availableSlots.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No available time slots for this date and duration.
                            </p>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {availableSlots.map(slot => (
                                    <Button
                                        key={slot.startTime}
                                        variant={
                                            selectedTime?.startTime === slot.startTime
                                                ? 'default'
                                                : 'outline'
                                        }
                                        disabled={!slot.available}
                                        onClick={() => slot.available && handleTimeSelect(slot)}
                                        className="text-sm"
                                    >
                                        {slot.startTime}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" onClick={goBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 4: Confirmation */}
            {step === 'confirm' && selectedDate && selectedTime && selectedDuration && (
                <Card>
                    <CardHeader>
                        <CardTitle>Confirm Booking</CardTitle>
                        <CardDescription>Review your lesson details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Teacher</span>
                                <span className="font-medium">{teacher.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date</span>
                                <span className="font-medium">{formatDate(selectedDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Time</span>
                                <span className="font-medium">
                                    {selectedTime.startTime} - {selectedTime.endTime}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Duration</span>
                                <span className="font-medium">{selectedDuration} minutes</span>
                            </div>
                            <div className="flex justify-between border-t pt-3">
                                <span className="font-medium">Total</span>
                                <span className="font-bold text-lg">${price.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Any special requests or topics you'd like to cover..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {!profile?.autoAccept && (
                            <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                                ℹ️ This lesson will require teacher confirmation before it&apos;s finalized.
                            </p>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="ghost" onClick={goBack} disabled={isSubmitting}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button onClick={handleConfirm} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Booking...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Confirm Booking
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}

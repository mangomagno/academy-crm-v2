'use client';

import * as React from 'react';
import {
    format,
    startOfWeek,
    addDays,
    eachDayOfInterval,
    isSameDay
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import type { Lesson, User } from '@/types';

interface CalendarWeekProps {
    date: Date;
    lessons: Lesson[];
    students: User[];
    onLessonClick?: (lesson: Lesson) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

export function CalendarWeek({ date, lessons, students, onLessonClick }: CalendarWeekProps) {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start on Monday
    const weekEnd = addDays(weekStart, 6);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const getStudentName = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        return student ? student.name : 'Unknown Student';
    };

    const getLessonsForDay = (day: Date) => {
        return lessons.filter(lesson => isSameDay(new Date(lesson.date), day));
    };

    const getLessonStyle = (lesson: Lesson) => {
        const startTime = lesson.startTime.split(':').map(Number);
        const startHour = startTime[0];
        const startMinute = startTime[1];

        const top = (startHour - 8) * 60 + startMinute;
        const height = lesson.duration;

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-bold">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex bg-muted/20 rounded-lg overflow-hidden border">
                    {/* Time Column */}
                    <div className="w-16 border-r bg-muted/10">
                        <div className="h-10 border-b flex items-center justify-center text-xs font-medium text-muted-foreground uppercase">
                            Time
                        </div>
                        {HOURS.map(hour => (
                            <div key={hour} className="h-[60px] border-b px-2 py-1 text-[10px] text-muted-foreground text-right tabular-nums">
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    <div className="flex-1 flex overflow-x-auto">
                        {days.map(day => {
                            const dayLessons = getLessonsForDay(day);
                            return (
                                <div key={day.toString()} className="flex-1 min-w-[120px] border-r last:border-r-0">
                                    <div className={cn(
                                        "h-10 border-b flex flex-col items-center justify-center text-xs font-semibold",
                                        isSameDay(day, new Date()) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                                    )}>
                                        <span>{format(day, 'EEE')}</span>
                                        <span>{format(day, 'd')}</span>
                                    </div>
                                    <div className="relative h-[780px] bg-grid-slate-100/[0.03] dark:bg-grid-slate-700/[0.03]">
                                        {/* Hour lines */}
                                        {HOURS.map(hour => (
                                            <div key={hour} className="h-[60px] border-b border-muted/50 w-full" />
                                        ))}

                                        {/* Lessons */}
                                        {dayLessons.map(lesson => (
                                            <div
                                                key={lesson.id}
                                                onClick={() => onLessonClick?.(lesson)}
                                                className={cn(
                                                    "absolute left-1 right-1 rounded-md border p-1 text-[10px] cursor-pointer shadow-sm transition-all hover:ring-2 hover:ring-primary overflow-hidden",
                                                    getStatusColor(lesson.status)
                                                )}
                                                style={getLessonStyle(lesson)}
                                            >
                                                <div className="font-bold truncate">{getStudentName(lesson.studentId)}</div>
                                                <div className="opacity-80 truncate">{lesson.startTime} - {lesson.endTime}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

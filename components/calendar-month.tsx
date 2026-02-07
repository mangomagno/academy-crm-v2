'use client';

import * as React from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lesson } from '@/types';

interface CalendarMonthProps {
    date: Date;
    lessons: Lesson[];
    onDateClick?: (date: Date) => void;
    onMonthChange?: (date: Date) => void;
}

export function CalendarMonth({ date, lessons, onDateClick, onMonthChange }: CalendarMonthProps) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    const getLessonsForDay = (day: Date) => {
        return lessons.filter(lesson => isSameDay(new Date(lesson.date), day));
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-bold">
                    {format(date, 'MMMM yyyy')}
                </CardTitle>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onMonthChange?.(subMonths(date, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onMonthChange?.(addMonths(date, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 border-t border-l">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="border-r border-b p-2 text-center text-xs font-semibold text-muted-foreground uppercase bg-muted/30">
                            {day}
                        </div>
                    ))}
                    {days.map((day) => {
                        const dayLessons = getLessonsForDay(day);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => onDateClick?.(day)}
                                className={cn(
                                    "min-h-[100px] border-r border-b p-2 cursor-pointer transition-colors hover:bg-muted/50",
                                    !isCurrentMonth && "bg-muted/10 text-muted-foreground/50",
                                    isToday && "bg-primary/5"
                                )}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={cn(
                                        "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                        isToday && "bg-primary text-primary-foreground font-bold"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {dayLessons.slice(0, 3).map(lesson => (
                                        <div
                                            key={lesson.id}
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded truncate border",
                                                lesson.status === 'confirmed' ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" :
                                                    lesson.status === 'pending' ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800" :
                                                        "bg-gray-100 text-gray-800 border-gray-200"
                                            )}
                                        >
                                            {lesson.startTime}
                                        </div>
                                    ))}
                                    {dayLessons.length > 3 && (
                                        <div className="text-[10px] text-muted-foreground font-medium pl-1">
                                            + {dayLessons.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

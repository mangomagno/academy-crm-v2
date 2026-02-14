'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
    useCurrentUser,
    useRequireApprovedTeacher
} from '@/hooks/use-auth';
import {
    useLessons,
    useUsers
} from '@/hooks/use-db';
import { CalendarWeek } from '@/components/calendar-week';
import { CalendarMonth } from '@/components/calendar-month';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays, addMonths, subMonths, format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

export default function CalendarPage() {
    const { isApproved, loading: authLoading } = useRequireApprovedTeacher();
    const { user } = useCurrentUser();
    const [view, setView] = React.useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const t = useTranslations('calendar');
    const tc = useTranslations('common');
    const locale = useLocale();
    const dateFnsLocale = locale === 'es' ? es : enUS;

    const lessons = useLessons(user?.id);
    const students = useUsers();

    if (authLoading) {
        return <div className="p-8">{tc('loading')}</div>;
    }

    if (!isApproved) return null;

    const handlePrevious = () => {
        if (view === 'week') {
            setCurrentDate(prev => subDays(prev, 7));
        } else {
            setCurrentDate(prev => subMonths(prev, 1));
        }
    };

    const handleNext = () => {
        if (view === 'week') {
            setCurrentDate(prev => addDays(prev, 7));
        } else {
            setCurrentDate(prev => addMonths(prev, 1));
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleToday}>
                        {tc('today')}
                    </Button>
                    <div className="flex items-center border rounded-md">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none border-r"
                            onClick={handlePrevious}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={handleNext}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="week" className="w-full" onValueChange={(v) => setView(v as 'week' | 'month')}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="week" className="px-6">{t('weekView')}</TabsTrigger>
                        <TabsTrigger value="month" className="px-6">{t('monthView')}</TabsTrigger>
                    </TabsList>
                    <div className="text-sm font-medium text-muted-foreground">
                        {view === 'week' ? (
                            <span>{format(currentDate, 'MMMM yyyy', { locale: dateFnsLocale })}</span>
                        ) : (
                            <span>{format(currentDate, 'yyyy')}</span>
                        )}
                    </div>
                </div>

                <TabsContent value="week" className="mt-0 border-none p-0">
                    <CalendarWeek
                        date={currentDate}
                        lessons={lessons || []}
                        students={students || []}
                    />
                </TabsContent>

                <TabsContent value="month" className="mt-0 border-none p-0">
                    <CalendarMonth
                        date={currentDate}
                        lessons={lessons || []}
                        onMonthChange={setCurrentDate}
                        onDateClick={(date) => {
                            setCurrentDate(date);
                            setView('week');
                        }}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

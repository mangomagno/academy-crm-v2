'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
    useCurrentUser,
    useRequireApprovedTeacher
} from '@/hooks/use-auth';
import {
    useAvailability,
    useTeacherProfile
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Trash2,
    Save,
    Clock,
    DollarSign,
    Settings2
} from 'lucide-react';
import { toast } from 'sonner';

const DAY_KEYS = [
    { value: 1, key: 'monday' },
    { value: 2, key: 'tuesday' },
    { value: 3, key: 'wednesday' },
    { value: 4, key: 'thursday' },
    { value: 5, key: 'friday' },
    { value: 6, key: 'saturday' },
    { value: 0, key: 'sunday' },
] as const;

export default function AvailabilityPage() {
    const { isApproved, loading: authLoading } = useRequireApprovedTeacher();
    const { user } = useCurrentUser();
    const profile = useTeacherProfile(user?.id);
    const availability = useAvailability(user?.id);
    const t = useTranslations('availability');
    const td = useTranslations('days');
    const tc = useTranslations('common');

    // Form states
    const [hourlyRate, setHourlyRate] = React.useState<number>(0);
    const [autoAccept, setAutoAccept] = React.useState<boolean>(false);
    const [newSlot, setNewSlot] = React.useState({
        dayOfWeek: '1',
        startTime: '09:00',
        endTime: '17:00'
    });

    React.useEffect(() => {
        if (profile) {
            setHourlyRate(profile.hourlyRate);
            setAutoAccept(profile.autoAccept);
        }
    }, [profile]);

    if (authLoading) {
        return <div className="p-8">{tc('loading')}</div>;
    }

    if (!isApproved) return null;

    const handleUpdateProfile = async () => {
        if (!user) return;
        try {
            await db.teacherProfiles.update(user.id, {
                hourlyRate: Number(hourlyRate),
                autoAccept
            });
            toast.success(t('profileSaved'));
        } catch {
            toast.error(t('profileSaveError'));
        }
    };

    const handleAddSlot = async () => {
        if (!user) return;
        try {
            await db.availability.add({
                id: crypto.randomUUID(),
                teacherId: user.id,
                dayOfWeek: parseInt(newSlot.dayOfWeek),
                startTime: newSlot.startTime,
                endTime: newSlot.endTime
            });
            toast.success(t('slotAdded'));
        } catch {
            toast.error(t('slotAddError'));
        }
    };

    const handleDeleteSlot = async (id: string) => {
        try {
            await db.availability.delete(id);
            toast.success(t('slotRemoved'));
        } catch {
            toast.error(t('slotRemoveError'));
        }
    };

    const getDayLabel = (dayValue: number) => {
        const day = DAY_KEYS.find(d => d.value === dayValue);
        return day ? td(day.key) : '';
    };

    const sortedAvailability = availability?.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
    });

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Settings */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Settings2 className="mr-2 h-5 w-5" />
                                {t('profileSettings')}
                            </CardTitle>
                            <CardDescription>
                                {t('description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="rate">{t('hourlyRate')}</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="rate"
                                        type="number"
                                        className="pl-8"
                                        value={hourlyRate}
                                        onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between space-x-2 border rounded-lg p-4 bg-muted/20">
                                <div className="space-y-1">
                                    <Label htmlFor="auto-accept" className="text-base">{t('autoAccept')}</Label>
                                    <p className="text-sm text-muted-foreground">
                                        {t('autoAcceptDesc')}
                                    </p>
                                </div>
                                <Switch
                                    id="auto-accept"
                                    checked={autoAccept}
                                    onCheckedChange={setAutoAccept}
                                />
                            </div>

                            <Button onClick={handleUpdateProfile} className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                {tc('save')}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Plus className="mr-2 h-5 w-5" />
                                {t('addSlot')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Select
                                    value={newSlot.dayOfWeek}
                                    onValueChange={(v) => setNewSlot(prev => ({ ...prev, dayOfWeek: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAY_KEYS.map(day => (
                                            <SelectItem key={day.value} value={day.value.toString()}>
                                                {td(day.key)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Input
                                        type="time"
                                        value={newSlot.startTime}
                                        onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        type="time"
                                        value={newSlot.endTime}
                                        onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleAddSlot} className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('addSlot')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: List of slots */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="mr-2 h-5 w-5" />
                            {t('weeklySchedule')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sortedAvailability?.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    {t('noSlots')}
                                </p>
                            ) : (
                                sortedAvailability?.map((slot) => (
                                    <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10 group">
                                        <div className="flex items-center space-x-3">
                                            <Badge variant="secondary" className="w-24 justify-center">
                                                {getDayLabel(slot.dayOfWeek)}
                                            </Badge>
                                            <span className="text-sm font-medium">
                                                {slot.startTime} - {slot.endTime}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDeleteSlot(slot.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

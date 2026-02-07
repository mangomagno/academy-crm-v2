'use client';

import * as React from 'react';
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

const DAYS_OF_WEEK = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
];

export default function AvailabilityPage() {
    const { isApproved, loading: authLoading } = useRequireApprovedTeacher();
    const { user } = useCurrentUser();
    const profile = useTeacherProfile(user?.id);
    const availability = useAvailability(user?.id);

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
        return <div className="p-8">Loading...</div>;
    }

    if (!isApproved) return null;

    const handleUpdateProfile = async () => {
        if (!user) return;
        try {
            await db.teacherProfiles.update(user.id, {
                hourlyRate: Number(hourlyRate),
                autoAccept
            });
            toast.success('Profile settings updated');
        } catch {
            toast.error('Failed to update profile settings');
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
            toast.success('Availability slot added');
        } catch {
            toast.error('Failed to add slot');
        }
    };

    const handleDeleteSlot = async (id: string) => {
        try {
            await db.availability.delete(id);
            toast.success('Slot removed');
        } catch {
            toast.error('Failed to remove slot');
        }
    };

    const sortedAvailability = availability?.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.startTime.localeCompare(b.startTime);
    });

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Availability & Settings</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column: Settings */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Settings2 className="mr-2 h-5 w-5" />
                                Profile Settings
                            </CardTitle>
                            <CardDescription>
                                Configure your rates and booking preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="rate">Hourly Rate ($)</Label>
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
                                    <Label htmlFor="auto-accept" className="text-base">Auto-accept Requests</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Instantly confirm new lesson bookings
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
                                Save Profile Settings
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Plus className="mr-2 h-5 w-5" />
                                Add Availability Window
                            </CardTitle>
                            <CardDescription>
                                Set your recurring weekly schedule
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Day of Week</Label>
                                <Select
                                    value={newSlot.dayOfWeek}
                                    onValueChange={(v) => setNewSlot(prev => ({ ...prev, dayOfWeek: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS_OF_WEEK.map(day => (
                                            <SelectItem key={day.value} value={day.value.toString()}>
                                                {day.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input
                                        type="time"
                                        value={newSlot.startTime}
                                        onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input
                                        type="time"
                                        value={newSlot.endTime}
                                        onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleAddSlot} className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Slot
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: List of slots */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="mr-2 h-5 w-5" />
                            Current Schedule
                        </CardTitle>
                        <CardDescription>
                            Your active weekly availability
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sortedAvailability?.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No availability slots defined yet.
                                </p>
                            ) : (
                                sortedAvailability?.map((slot) => (
                                    <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10 group">
                                        <div className="flex items-center space-x-3">
                                            <Badge variant="secondary" className="w-24 justify-center">
                                                {DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label}
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

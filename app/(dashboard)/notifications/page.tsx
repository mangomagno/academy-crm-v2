'use client';

import { useNotifications } from '@/hooks/use-db';
import { useSession } from 'next-auth/react';
import { markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Trash2, Bell, BellOff } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const notifications = useNotifications(userId);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
    };

    const handleMarkAllAsRead = async () => {
        if (userId) {
            await markAllNotificationsAsRead(userId);
        }
    };

    if (!notifications) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <p className="text-muted-foreground">Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Manage your alerts and lesson updates.
                    </p>
                </div>
                {notifications.length > 0 && (
                    <Button variant="outline" onClick={handleMarkAllAsRead}>
                        Mark all as read
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                    <CardDescription>
                        You have {notifications.filter(n => !n.read).length} unread notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {notifications.length > 0 ? (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start justify-between py-4 first:pt-0 last:pb-0",
                                        !notification.read && "bg-muted/30 -mx-4 px-4 rounded-md"
                                    )}
                                >
                                    <div className="flex gap-4">
                                        <div className={cn(
                                            "mt-1 rounded-full p-2",
                                            notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                                        )}>
                                            <Bell className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className={cn("text-sm", !notification.read && "font-semibold")}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(notification.createdAt), 'PPp')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!notification.read && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(notification.id)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            title="Delete notification"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <BellOff className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">No notifications yet</p>
                            <p className="text-sm text-muted-foreground max-w-[200px]">
                                We&apos;ll let you know when something important happens.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

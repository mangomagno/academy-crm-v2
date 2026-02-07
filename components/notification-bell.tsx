'use client';

import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications, useUnreadNotificationCount } from '@/hooks/use-db';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';
import { useSession } from 'next-auth/react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const { data: session } = useSession();
    const router = useRouter();
    const userId = session?.user?.id;
    const notifications = useNotifications(userId);
    const unreadCount = useUnreadNotificationCount(userId);

    const handleNotificationClick = async (id: string, relatedId?: string) => {
        await markNotificationAsRead(id);
        if (relatedId) {
            // Depending on the relatedId, we might want to navigate
            // For now, let's just keep it simple
        }
    };

    const handleMarkAllAsRead = async () => {
        if (userId) {
            await markAllNotificationsAsRead(userId);
        }
    };

    const recentNotifications = notifications?.slice(0, 5) ?? [];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5 flex items-center justify-center rounded-full"
                            variant="destructive"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={handleMarkAllAsRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[20rem]">
                    {recentNotifications.length > 0 ? (
                        recentNotifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start p-4 cursor-pointer",
                                    !notification.read && "bg-muted/50"
                                )}
                                onClick={() => handleNotificationClick(notification.id, notification.relatedId)}
                            >
                                <span className="font-medium text-sm">{notification.message}</span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No notifications
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="w-full text-center flex justify-center cursor-pointer font-medium"
                    onClick={() => router.push('/notifications')}
                >
                    View all notifications
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

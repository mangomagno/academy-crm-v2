'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GraduationCap } from 'lucide-react';
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarTrigger,
    SidebarInset,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { SidebarNav } from '@/components/sidebar-nav';
import { UserNav } from '@/components/user-nav';
import { NotificationBell } from '@/components/notification-bell';


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'loading') return;

        if (status === 'unauthenticated') {
            router.replace('/login');
            return;
        }

        // Check if teacher needs approval
        if (session?.user?.role === 'teacher') {
            if (session.user.teacherStatus === 'pending') {
                router.replace('/pending-approval');
                return;
            }
            if (session.user.teacherStatus === 'rejected') {
                router.replace('/registration-rejected');
                return;
            }
        }
    }, [status, session, router]);

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader className="border-b">
                    <div className="flex items-center gap-2 px-2 py-4">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <span className="font-semibold text-lg">Academy CRM</span>
                    </div>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarNav />
                </SidebarContent>
                <SidebarFooter className="border-t p-4">
                    <div className="text-xs text-muted-foreground">
                        © 2026 Academy CRM
                    </div>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-14 items-center gap-4 border-b px-4">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex-1" />
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <UserNav />
                    </div>
                </header>
                <main className="flex-1 p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

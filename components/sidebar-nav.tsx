'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { getNavItemsForRole } from '@/components/nav-items';
import { useUserRole } from '@/hooks/use-auth';

export function SidebarNav() {
    const pathname = usePathname();
    const role = useUserRole();

    if (!role) {
        return null;
    }

    const navItems = getNavItemsForRole(role);

    return (
        <SidebarMenu>
            {navItems.map((item) => {
                const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));

                return (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                        >
                            <Link href={item.href}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}

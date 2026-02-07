import {
    Users,
    Calendar,
    GraduationCap,
    Clock,
    DollarSign,
    Home,
    History,
    type LucideIcon
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
}

export const studentNavItems: NavItem[] = [
    { title: 'Browse Teachers', href: '/teachers', icon: Users },
    { title: 'My Teachers', href: '/my-teachers', icon: GraduationCap },
    { title: 'My Lessons', href: '/lessons', icon: Calendar },
    { title: 'History', href: '/lessons/history', icon: History },
];

export const teacherNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: Home },
    { title: 'Calendar', href: '/calendar', icon: Calendar },
    { title: 'Students', href: '/students', icon: Users },
    { title: 'Availability', href: '/availability', icon: Clock },
    { title: 'Finance', href: '/finance', icon: DollarSign },
];

export const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: Home },
    { title: 'Users', href: '/admin/users', icon: Users },
    { title: 'All Lessons', href: '/admin/lessons', icon: Calendar },
    { title: 'All Payments', href: '/admin/payments', icon: DollarSign },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
    switch (role) {
        case 'admin':
            return adminNavItems;
        case 'teacher':
            return teacherNavItems;
        case 'student':
            return studentNavItems;
        default:
            return [];
    }
}

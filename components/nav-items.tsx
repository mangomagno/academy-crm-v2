'use client';

import {
    LayoutDashboard,
    CalendarDays,
    Users,
    Clock,
    DollarSign,
    GraduationCap,
    BookOpen,
    History,
    ShieldCheck,
    UserCog,
    CreditCard,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

export function useNavItems(role: string): NavItem[] {
    const t = useTranslations('nav');

    const studentItems: NavItem[] = [
        { title: t('browseTeachers'), href: '/teachers', icon: GraduationCap },
        { title: t('myTeachers'), href: '/my-teachers', icon: Users },
        { title: t('myLessons'), href: '/lessons', icon: BookOpen },
        { title: t('history'), href: '/lessons/history', icon: History },
    ];

    const teacherItems: NavItem[] = [
        { title: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { title: t('calendar'), href: '/calendar', icon: CalendarDays },
        { title: t('students'), href: '/students', icon: Users },
        { title: t('availability'), href: '/availability', icon: Clock },
        { title: t('finance'), href: '/finance', icon: DollarSign },
    ];

    const adminItems: NavItem[] = [
        { title: t('admin'), href: '/admin', icon: ShieldCheck },
        { title: t('users'), href: '/admin/users', icon: UserCog },
        { title: t('allLessons'), href: '/admin/lessons', icon: BookOpen },
        { title: t('allPayments'), href: '/admin/payments', icon: CreditCard },
    ];

    switch (role) {
        case 'student':
            return studentItems;
        case 'teacher':
            return teacherItems;
        case 'admin':
            return adminItems;
        default:
            return [];
    }
}

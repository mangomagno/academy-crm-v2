'use client';

import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-auth';
import { LanguageSwitcher } from '@/components/language-switcher';

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
    switch (role) {
        case 'admin':
            return 'default';
        case 'teacher':
            return 'secondary';
        default:
            return 'outline';
    }
}

export function UserNav() {
    const { user, loading } = useCurrentUser();
    const { theme, setTheme } = useTheme();
    const t = useTranslations('common');

    if (loading || !user) {
        return (
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                        <div className="pt-1">
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                        {theme === 'dark' ? (
                            <>
                                <Sun className="mr-2 h-4 w-4" />
                                <span>{t('lightMode')}</span>
                            </>
                        ) : (
                            <>
                                <Moon className="mr-2 h-4 w-4" />
                                <span>{t('darkMode')}</span>
                            </>
                        )}
                    </DropdownMenuItem>
                    <LanguageSwitcher />
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('signOut')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('common');

    const switchLocale = (newLocale: string) => {
        document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
        router.refresh();
    };

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Globe className="mr-2 h-4 w-4" />
                {t('language')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                <DropdownMenuItem
                    onClick={() => switchLocale('en')}
                    className={locale === 'en' ? 'bg-accent' : ''}
                >
                    🇺🇸 {t('english')}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => switchLocale('es')}
                    className={locale === 'es' ? 'bg-accent' : ''}
                >
                    🇪🇸 {t('spanish')}
                </DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}

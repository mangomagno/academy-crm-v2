'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { XCircle, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RegistrationRejectedPage() {
    const t = useTranslations('auth');

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-2xl">{t('registrationRejected')}</CardTitle>
                <CardDescription>
                    {t('registrationRejectedDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Button variant="outline" onClick={() => signOut({ callbackUrl: '/login' })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('signOut')}
                </Button>
            </CardContent>
        </Card>
    );
}

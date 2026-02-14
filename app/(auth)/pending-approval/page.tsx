'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Clock, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { db } from '@/lib/db';

export default function PendingApprovalPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const t = useTranslations('auth');
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        async function checkStatus() {
            if (!session?.user?.email) return;

            const user = await db.users.where('email').equals(session.user.email).first();
            if (user?.teacherStatus === 'approved') {
                router.replace('/dashboard');
            } else if (user?.teacherStatus === 'rejected') {
                router.replace('/registration-rejected');
            }
            setChecking(false);
        }

        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [session, router]);

    if (checking) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner className="h-8 w-8" />
                <span className="ml-2">{t('checkingStatus')}</span>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl">{t('pendingApproval')}</CardTitle>
                <CardDescription>
                    {t('pendingApprovalDesc')}
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

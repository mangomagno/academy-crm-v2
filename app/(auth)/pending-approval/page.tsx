'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function PendingApprovalPage() {
    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
                        <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl">Pending Approval</CardTitle>
                <CardDescription>
                    Your teacher account is awaiting approval
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                    Thank you for registering as a teacher on Academy CRM.
                    An administrator will review your account shortly.
                </p>
                <p className="text-muted-foreground">
                    You&apos;ll be notified once your account has been approved
                    and you can start accepting students.
                </p>
            </CardContent>
            <CardFooter className="flex justify-center">
                <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                >
                    Sign out
                </Button>
            </CardFooter>
        </Card>
    );
}

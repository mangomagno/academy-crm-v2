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
import { XCircle } from 'lucide-react';

export default function RegistrationRejectedPage() {
    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                    <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl">Registration Rejected</CardTitle>
                <CardDescription>
                    Your teacher application was not approved
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                    We&apos;re sorry, but your teacher registration has been rejected.
                </p>
                <p className="text-muted-foreground">
                    If you believe this was a mistake or would like more information,
                    please contact support for assistance.
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

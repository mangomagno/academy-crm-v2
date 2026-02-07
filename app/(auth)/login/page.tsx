'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth-utils';
import { seedIfEmpty } from '@/lib/seed';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSeeding, setIsSeeding] = useState(true);

    // Auto-seed database on first load
    useEffect(() => {
        async function initDb() {
            try {
                await seedIfEmpty();
            } catch (error) {
                console.error('Error initializing database:', error);
            } finally {
                setIsSeeding(false);
            }
        }
        initDb();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Verify credentials client-side with Dexie (IndexedDB)
            const user = await db.users.where('email').equals(email).first();

            if (!user) {
                toast.error('Invalid email or password');
                setIsLoading(false);
                return;
            }

            const isValid = await verifyPassword(password, user.password);

            if (!isValid) {
                toast.error('Invalid email or password');
                setIsLoading(false);
                return;
            }

            // Pass verified user data to signIn (server just creates session)
            const result = await signIn('credentials', {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                teacherStatus: user.teacherStatus || '',
                redirect: false,
            });

            if (result?.error) {
                toast.error('Invalid email or password');
                setIsLoading(false);
                return;
            }

            toast.success('Logged in successfully');

            // Redirect will be handled by middleware or we refresh
            router.refresh();
            router.push('/');
        } catch {
            toast.error('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Sign in</CardTitle>
                <CardDescription>
                    Enter your email and password to access your account
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading || isSeeding}>
                        {isLoading ? (
                            <>
                                <Spinner className="mr-2" />
                                Signing in...
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-primary hover:underline">
                            Register
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}

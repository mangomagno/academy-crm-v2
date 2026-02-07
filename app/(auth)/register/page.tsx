'use client';

import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth-utils';
import type { UserRole } from '@/types';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'student' | 'teacher'>('student');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            // Check if email already exists
            const existingUser = await db.users.where('email').equals(email).first();
            if (existingUser) {
                toast.error('An account with this email already exists');
                setIsLoading(false);
                return;
            }

            // Create user in database
            const hashedPassword = await hashPassword(password);
            const userId = crypto.randomUUID();

            await db.users.add({
                id: userId,
                email,
                password: hashedPassword,
                name,
                role: role as UserRole,
                teacherStatus: role === 'teacher' ? 'pending' : undefined,
                createdAt: new Date(),
            });

            // If teacher, create default profile
            if (role === 'teacher') {
                await db.teacherProfiles.add({
                    userId,
                    hourlyRate: 50,
                    lessonDurations: [30, 45, 60],
                    autoAccept: false,
                });
            }

            toast.success('Account created successfully');

            // Auto-login with verified user data
            const teacherStatus = role === 'teacher' ? 'pending' : '';
            const result = await signIn('credentials', {
                id: userId,
                email,
                name,
                role,
                teacherStatus,
                redirect: false,
            });

            if (result?.error) {
                // Registration succeeded but login failed - redirect to login
                router.push('/login');
                return;
            }

            // Redirect based on role
            if (role === 'teacher') {
                router.push('/pending-approval');
            } else {
                router.push('/teachers');
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Create an account</CardTitle>
                <CardDescription>
                    Enter your information to get started
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
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
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>I am a...</Label>
                        <RadioGroup
                            value={role}
                            onValueChange={(value) => setRole(value as 'student' | 'teacher')}
                            disabled={isLoading}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="student" id="student" />
                                <Label htmlFor="student" className="font-normal cursor-pointer">
                                    Student looking for music lessons
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="teacher" id="teacher" />
                                <Label htmlFor="teacher" className="font-normal cursor-pointer">
                                    Teacher offering music lessons
                                </Label>
                            </div>
                        </RadioGroup>
                        {role === 'teacher' && (
                            <p className="text-sm text-muted-foreground">
                                Note: Teacher accounts require admin approval before you can start accepting students.
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Spinner className="mr-2" />
                                Creating account...
                            </>
                        ) : (
                            'Create account'
                        )}
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    );
}

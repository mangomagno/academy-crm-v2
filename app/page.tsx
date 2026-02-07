'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/spinner';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }

    // Redirect based on role
    const role = session?.user?.role;

    if (role === 'admin') {
      router.replace('/admin');
    } else if (role === 'teacher') {
      const teacherStatus = session?.user?.teacherStatus;
      if (teacherStatus === 'pending') {
        router.replace('/pending-approval');
      } else if (teacherStatus === 'rejected') {
        router.replace('/registration-rejected');
      } else {
        router.replace('/dashboard');
      }
    } else if (role === 'student') {
      router.replace('/teachers');
    } else {
      router.replace('/login');
    }
  }, [status, session, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

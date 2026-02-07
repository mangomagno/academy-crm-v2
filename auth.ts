import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth-utils';
import type { UserRole, TeacherStatus } from '@/types';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Find user by email
                const user = await db.users.where('email').equals(email).first();

                if (!user) {
                    return null;
                }

                // Verify password
                const isValid = await verifyPassword(password, user.password);

                if (!isValid) {
                    return null;
                }

                // Return user object for session
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    teacherStatus: user.teacherStatus
                };
            }
        })
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.role = user.role as UserRole;
                token.teacherStatus = user.teacherStatus as TeacherStatus | undefined;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id as string;
            session.user.role = token.role as UserRole;
            session.user.teacherStatus = token.teacherStatus as TeacherStatus | undefined;
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt'
    }
});

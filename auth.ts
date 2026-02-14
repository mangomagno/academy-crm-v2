import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { UserRole, TeacherStatus } from '@/types';

/**
 * Auth.js configuration for Academy CRM.
 * 
 * IMPORTANT: Since we use Dexie (IndexedDB) which is client-side only,
 * credential verification happens in the browser before calling signIn.
 * The authorize function receives pre-verified user data.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                // These fields contain pre-verified user data from client
                id: { type: 'text' },
                email: { type: 'email' },
                name: { type: 'text' },
                role: { type: 'text' },
                teacherStatus: { type: 'text' },
            },
            async authorize(credentials) {
                // Client already verified credentials against Dexie
                // Just validate we have the required fields
                if (!credentials?.id || !credentials?.email || !credentials?.name || !credentials?.role) {
                    return null;
                }

                return {
                    id: credentials.id as string,
                    name: credentials.name as string,
                    email: credentials.email as string,
                    role: credentials.role as UserRole,
                    teacherStatus: (credentials.teacherStatus as TeacherStatus) || undefined,
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
    },
    trustHost: true
});

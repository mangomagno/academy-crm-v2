import type { UserRole, TeacherStatus } from './index';

declare module 'next-auth' {
    interface User {
        id: string;
        role: UserRole;
        teacherStatus?: TeacherStatus;
    }

    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            role: UserRole;
            teacherStatus?: TeacherStatus;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: UserRole;
        teacherStatus?: TeacherStatus;
    }
}

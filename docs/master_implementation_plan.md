# Academy CRM - Implementation Plan

A CRM for freelance music teachers with three user roles: **Admin**, **Teacher**, and **Student**. Built with Next.js 16, TypeScript, Tailwind CSS, Shadcn UI, Dexie.js (IndexedDB), and Auth.js.

## User Review Required

> [!IMPORTANT]
> **Teacher Approval Flow**: Teachers who register will be marked as `pending` until an admin approves them. They won't be able to access teacher features until approved.

> [!NOTE]
> **Local Development**: Since we're using Dexie.js (IndexedDB), all data is browser-local. Each browser/profile has its own database. Seed data will create a default admin account for testing.

---

## Phase 1: Project Setup & Database Schema

### Dependencies

Install required packages:
```bash
npm install dexie dexie-react-hooks next-auth@beta
```

---

### [NEW] [types/index.ts](file:///c:/Users/avzma/Documents/GitHub/academy-crm/types/index.ts)

Core TypeScript interfaces:

```typescript
export type UserRole = 'admin' | 'teacher' | 'student';
export type TeacherStatus = 'pending' | 'approved' | 'rejected';
export type LessonStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: UserRole;
  teacherStatus?: TeacherStatus; // only for teachers
  createdAt: Date;
}

export interface TeacherProfile {
  userId: string;
  bio?: string;
  hourlyRate: number;
  lessonDurations: number[]; // e.g., [30, 45, 60]
  autoAccept: boolean;
}

export interface Availability {
  id: string;
  teacherId: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface BlockedSlot {
  id: string;
  teacherId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  reason?: string;
}

export interface Subscription {
  id: string;
  studentId: string;
  teacherId: string;
  createdAt: Date;
}

export interface Lesson {
  id: string;
  teacherId: string;
  studentId: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  status: LessonStatus;
  notes?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  lessonId: string;
  teacherId: string;
  studentId: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: Date;
  month: string; // "2026-02"
}

export interface Notification {
  id: string;
  userId: string;
  type: 'lesson_request' | 'lesson_confirmed' | 'lesson_cancelled' | 'reschedule_request' | 'teacher_approved';
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: Date;
}
```

---

### [NEW] [lib/db.ts](file:///c:/Users/avzma/Documents/GitHub/academy-crm/lib/db.ts)

Dexie database definition:

```typescript
import Dexie, { type Table } from 'dexie';
import type { User, TeacherProfile, Availability, BlockedSlot, Subscription, Lesson, Payment, Notification } from '@/types';

export class AcademyCRMDatabase extends Dexie {
  users!: Table<User, string>;
  teacherProfiles!: Table<TeacherProfile, string>;
  availability!: Table<Availability, string>;
  blockedSlots!: Table<BlockedSlot, string>;
  subscriptions!: Table<Subscription, string>;
  lessons!: Table<Lesson, string>;
  payments!: Table<Payment, string>;
  notifications!: Table<Notification, string>;

  constructor() {
    super('AcademyCRM');
    this.version(1).stores({
      users: 'id, email, role, teacherStatus',
      teacherProfiles: 'userId',
      availability: 'id, teacherId, dayOfWeek',
      blockedSlots: 'id, teacherId, date',
      subscriptions: 'id, studentId, teacherId, [studentId+teacherId]',
      lessons: 'id, teacherId, studentId, date, status, [teacherId+date], [studentId+date]',
      payments: 'id, lessonId, teacherId, studentId, status, month',
      notifications: 'id, userId, read, createdAt'
    });
  }
}

export const db = new AcademyCRMDatabase();
```

---

### [NEW] [auth.ts](file:///c:/Users/avzma/Documents/GitHub/academy-crm/auth.ts)

Auth.js configuration with credentials provider:

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Auth logic - validate against Dexie
        // Return user object or null
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.teacherStatus = user.teacherStatus;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.teacherStatus = token.teacherStatus;
      return session;
    }
  }
});
```

---

### [NEW] [app/api/auth/[...nextauth]/route.ts](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/api/auth/%5B...nextauth%5D/route.ts)

NextAuth route handler.

---

### Verification (Phase 1)

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 2: Core Data Layer & Seed Data

### [NEW] [lib/seed.ts](file:///c:/Users/avzma/Documents/GitHub/academy-crm/lib/seed.ts)

Seed database with test data including:
- 1 Admin user (admin@example.com / password123)
- 2 Teachers (1 approved, 1 pending)
- 2 Students
- Sample availability, subscriptions, and lessons

---

### [NEW] [hooks/use-db.ts](file:///c:/Users/avzma/Documents/GitHub/academy-crm/hooks/use-db.ts)

Database hooks using `useLiveQuery` from dexie-react-hooks for reactive data:
- `useUsers()`, `useTeachers()`, `useStudents()`
- `useLessons(teacherId?, studentId?)`
- `useAvailability(teacherId)`
- `useSubscriptions(studentId?, teacherId?)`
- `useNotifications(userId)`
- `usePayments(teacherId?, month?)`

---

### [NEW] [hooks/use-auth.ts](file:///c:/Users/avzma/Documents/GitHub/academy-crm/hooks/use-auth.ts)

Auth utility hooks:
- `useCurrentUser()` - get current authenticated user
- `useRequireRole(roles: UserRole[])` - redirect if not authorized

---

### Verification (Phase 2)

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 3: Layout & Navigation

### [NEW] [components/providers.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/components/providers.tsx)

Client-side providers wrapper (SessionProvider, ThemeProvider).

---

### [MODIFY] [app/layout.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/layout.tsx)

Wrap with providers, add Toaster component.

---

### [NEW] [app/(auth)/login/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(auth)/login/page.tsx)

Login form with email/password.

---

### [NEW] [app/(auth)/register/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(auth)/register/page.tsx)

Registration form with role selection (student/teacher).

---

### [NEW] [app/(dashboard)/layout.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/layout.tsx)

Dashboard layout with:
- Sidebar navigation (role-specific menu items)
- Header with user info and notifications bell
- Main content area

---

### [NEW] [components/nav-items.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/components/nav-items.tsx)

Role-based navigation configuration:

| Role | Menu Items |
|------|------------|
| **Student** | Browse Teachers, My Teachers, My Lessons, History |
| **Teacher** | Dashboard, Calendar, Students, Availability, Finance |
| **Admin** | Dashboard, Users, All Lessons, All Payments |

---

### Verification (Phase 3)

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 4: Student Features

### [NEW] [app/(dashboard)/teachers/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/teachers/page.tsx)

Browse approved teachers with:
- Grid of teacher cards
- Name, bio, hourly rate
- Subscribe button

---

### [NEW] [app/(dashboard)/teachers/[id]/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/teachers/%5Bid%5D/page.tsx)

Teacher profile page:
- Full profile info
- Weekly availability preview
- Subscribe/unsubscribe button

---

### [NEW] [app/(dashboard)/my-teachers/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/my-teachers/page.tsx)

List of subscribed teachers with:
- Teacher info cards
- "Book Lesson" button per teacher

---

### [NEW] [app/(dashboard)/book/[teacherId]/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/book/%5BteacherId%5D/page.tsx)

Lesson booking flow:
1. Calendar date picker (showing available dates)
2. Time slot selection (based on teacher availability)
3. Duration selection
4. Confirmation

---

### [NEW] [app/(dashboard)/lessons/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/lessons/page.tsx)

Student's lesson management:
- Upcoming lessons (with cancel/reschedule options)
- Past lessons (history)

---

### Verification (Phase 4)

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 5: Teacher Features

### [NEW] [app/(dashboard)/dashboard/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/dashboard/page.tsx)

Teacher dashboard with:
- Today's lessons
- Pending lesson requests
- Quick stats (students count, lessons this week, earnings this month)

---

### [NEW] [app/(dashboard)/availability/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/availability/page.tsx)

Availability management:
- Weekly recurring schedule builder
- Blocked dates manager (holidays, sick days)
- Lesson duration and rate settings

---

### [NEW] [app/(dashboard)/calendar/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/calendar/page.tsx)

Calendar view with toggle:
- **Weekly view**: Time slots with lessons
- **Monthly view**: Days with lesson counts
- Click to view lesson details

---

### [NEW] [components/calendar-week.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/components/calendar-week.tsx)

Weekly calendar component with time grid.

---

### [NEW] [components/calendar-month.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/components/calendar-month.tsx)

Monthly calendar component with lesson counts.

---

### [NEW] [app/(dashboard)/students/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/students/page.tsx)

"My Students" page:
- List of students subscribed to this teacher
- Lesson count per student
- Link to student lesson history

---

### Verification (Phase 5)

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 6: Finance Module

### [NEW] [app/(dashboard)/finance/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/finance/page.tsx)

Finance dashboard with:
- Monthly earnings chart (recharts)
- Current month billing breakdown by student
- Payment status checkboxes
- Month selector

---

### [NEW] [components/earnings-chart.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/components/earnings-chart.tsx)

Bar/line chart showing monthly earnings history.

---

### [NEW] [components/billing-table.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/components/billing-table.tsx)

Table with:
- Student name
- Lesson count
- Total duration
- Amount due
- Payment status checkbox

---

### Verification (Phase 6)

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 7: Admin Features

### [NEW] [app/(dashboard)/admin/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/admin/page.tsx)

Admin dashboard with:
- Platform stats (users, lessons, revenue)
- Pending teacher approvals list
- Recent activity

---

### [NEW] [app/(dashboard)/admin/users/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/admin/users/page.tsx)

User management:
- Filterable user table
- Role change dropdown
- Teacher approval/rejection
- User edit/delete

---

### [NEW] [app/(dashboard)/admin/lessons/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/admin/lessons/page.tsx)

All lessons view with filters.

---

### [NEW] [app/(dashboard)/admin/payments/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/admin/payments/page.tsx)

All payments view with filters.

---

### Verification (Phase 7)

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Phase 8: Notifications System

### [NEW] [components/notification-bell.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/components/notification-bell.tsx)

Header notification bell with:
- Unread count badge
- Dropdown with recent notifications
- Mark as read

---

### [NEW] [app/(dashboard)/notifications/page.tsx](file:///c:/Users/avzma/Documents/GitHub/academy-crm/app/(dashboard)/notifications/page.tsx)

Full notifications center.

---

### [NEW] [lib/notifications.ts](file:///c:/Users/avzma/Documents/GitHub/academy-crm/lib/notifications.ts)

Notification creation utilities for:
- Lesson request (to teacher)
- Lesson confirmed/cancelled (to student)
- Reschedule request (to other party)
- Teacher approved (to teacher)

---

### Verification (Phase 8)

```bash
npx tsc --noEmit
npm run lint
npm run build
```

---

## Verification Plan

### Automated Verification (Each Phase)

Run after completing each phase:

```bash
# TypeScript type checking
npx tsc --noEmit

# Linting
npm run lint

# Production build
npm run build
```

### Manual Testing

After full implementation:

1. **Auth Flow**
   - Register as student → should auto-get student role
   - Register as teacher → should show "pending approval" message
   - Login with admin (admin@example.com / password123) → approve teacher
   - Login as teacher → should now access teacher features

2. **Student Flow**
   - Browse teachers → see approved teachers only
   - Subscribe to a teacher → teacher appears in "My Teachers"
   - Book a lesson → select date/time → confirm
   - Cancel a lesson → lesson status changes

3. **Teacher Flow**
   - Set availability → recurring schedule
   - View calendar → see booked lessons
   - Accept/reject lesson requests
   - Mark payments as paid in finance

4. **Admin Flow**
   - View all users → filter by role
   - Approve pending teacher → teacher status changes
   - View all lessons and payments

---

## File Structure Summary

```
academy-crm/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── teachers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── my-teachers/page.tsx
│   │   ├── book/[teacherId]/page.tsx
│   │   ├── lessons/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── availability/page.tsx
│   │   ├── students/page.tsx
│   │   ├── finance/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── users/page.tsx
│   │       ├── lessons/page.tsx
│   │       └── payments/page.tsx
│   ├── api/auth/[...nextauth]/route.ts
│   └── layout.tsx
├── components/
│   ├── providers.tsx
│   ├── nav-items.tsx
│   ├── calendar-week.tsx
│   ├── calendar-month.tsx
│   ├── notification-bell.tsx
│   ├── earnings-chart.tsx
│   ├── billing-table.tsx
│   └── ui/... (existing shadcn)
├── hooks/
│   ├── use-db.ts
│   └── use-auth.ts
├── lib/
│   ├── db.ts
│   ├── seed.ts
│   ├── notifications.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── auth.ts
```

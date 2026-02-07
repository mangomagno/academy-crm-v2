I want to creat a basic CRM for freelance music teachers.

Technical specifications:
- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI
- Dexie.js (for local database for dev purposes, later we will switch to a PostgreSQL or Convex)
- Auth.js

Functional specifications:
- Three types of users: admin, teacher, and student.
- Students can belong to one or more teachers.
- Basic in-app notification system for lesson requests, approvals, cancellations, and reminders.

Student capabilities:
- Browse available teachers.
- Check the calendar for a given teacher.
- Book a lesson.
- Cancel a lesson (any time before the lesson starts; no cancellation fee).
- Send a reschedule request (must be approved by the teacher).
- View their lesson history.

Teacher capabilities:
- Set recurring availability windows (e.g., Mon-Fri 9am-5pm).
- Block specific dates/times (holidays, sick days).
- Configure lesson options (duration, types, rates, location/format).
- View their calendar.
- Accept or reject a lesson request.
- Set auto-accept for lesson requests if they want.
- Send a reschedule request (must be approved by the student).
- Cancel a lesson (any time before the lesson starts; no payment is generated for cancelled lessons).
- View a "My Students" page with all students who belong to them.
- View their lesson history.
- Use a simple finance section where they can:
    - Set their hourly rate
    - Check how much they have to bill their students based on duration of accepted lessons for each month
    - Use some sort of checkbox system to mark payments as done (payments done outside of the app, e.g. cash, bank transfer, etc.)
    - See their monthly earnings history (e.g., on a dashboard with simple charts and tables)

Admin capabilities:
- View all users
- Change user roles
- View all lessons
- View all payments
- View all finance information
- Manage users (add, edit, delete).
- Manage lessons (add, edit, delete).
- Manage payments (add, edit, delete).
- Manage finance information (add, edit, delete).

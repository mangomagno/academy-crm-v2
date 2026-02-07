import type { Availability, BlockedSlot, Lesson } from '@/types';

export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
}

/**
 * Parse a time string (HH:MM) into minutes since midnight
 */
export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight back to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return s1 < e2 && s2 < e1;
}

/**
 * Check if a date is blocked (fully or at a specific time)
 */
export function isDateBlocked(
    date: Date,
    blockedSlots: BlockedSlot[],
    startTime?: string,
    endTime?: string
): boolean {
    const dateStr = date.toISOString().split('T')[0];

    for (const slot of blockedSlots) {
        const slotDateStr = new Date(slot.date).toISOString().split('T')[0];
        if (slotDateStr !== dateStr) continue;

        // All-day block
        if (slot.allDay) return true;

        // Partial block - check time overlap if times provided
        if (startTime && endTime && slot.startTime && slot.endTime) {
            if (timeRangesOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Check if a lesson exists at a specific time
 */
export function hasLessonConflict(
    date: Date,
    startTime: string,
    endTime: string,
    lessons: Lesson[]
): boolean {
    const dateStr = date.toISOString().split('T')[0];

    for (const lesson of lessons) {
        // Skip cancelled lessons
        if (lesson.status === 'cancelled') continue;

        const lessonDateStr = new Date(lesson.date).toISOString().split('T')[0];
        if (lessonDateStr !== dateStr) continue;

        if (timeRangesOverlap(startTime, endTime, lesson.startTime, lesson.endTime)) {
            return true;
        }
    }
    return false;
}

/**
 * Get availability slots for a specific day of week
 */
export function getAvailabilityForDay(
    dayOfWeek: number,
    availability: Availability[]
): Availability[] {
    return availability
        .filter(a => a.dayOfWeek === dayOfWeek)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/**
 * Generate time slots from an availability window
 */
export function generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number
): { startTime: string; endTime: string }[] {
    const slots: { startTime: string; endTime: string }[] = [];
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    let currentStart = startMinutes;
    while (currentStart + duration <= endMinutes) {
        slots.push({
            startTime: minutesToTime(currentStart),
            endTime: minutesToTime(currentStart + duration),
        });
        // Move by 30-minute increments for slot start times
        currentStart += 30;
    }

    return slots;
}

/**
 * Get all available time slots for a given date
 */
export function getAvailableSlots(
    date: Date,
    availability: Availability[],
    blockedSlots: BlockedSlot[],
    existingLessons: Lesson[],
    duration: number
): TimeSlot[] {
    const dayOfWeek = date.getDay();
    const dayAvailability = getAvailabilityForDay(dayOfWeek, availability);

    if (dayAvailability.length === 0) {
        return [];
    }

    const allSlots: TimeSlot[] = [];

    for (const avail of dayAvailability) {
        const possibleSlots = generateTimeSlots(avail.startTime, avail.endTime, duration);

        for (const slot of possibleSlots) {
            const isBlocked = isDateBlocked(date, blockedSlots, slot.startTime, slot.endTime);
            const hasConflict = hasLessonConflict(date, slot.startTime, slot.endTime, existingLessons);

            allSlots.push({
                startTime: slot.startTime,
                endTime: slot.endTime,
                available: !isBlocked && !hasConflict,
            });
        }
    }

    // Remove duplicates and sort
    const uniqueSlots = new Map<string, TimeSlot>();
    for (const slot of allSlots) {
        const key = `${slot.startTime}-${slot.endTime}`;
        // If we already have this slot, keep the one that's unavailable (more restrictive)
        const existing = uniqueSlots.get(key);
        if (!existing || !slot.available) {
            uniqueSlots.set(key, slot);
        }
    }

    return Array.from(uniqueSlots.values())
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/**
 * Check if a date has any available slots
 */
export function hasAvailableSlots(
    date: Date,
    availability: Availability[],
    blockedSlots: BlockedSlot[],
    existingLessons: Lesson[],
    durations: number[]
): boolean {
    // Check if date is fully blocked for all-day
    if (isDateBlocked(date, blockedSlots)) {
        return false;
    }

    // Check for at least one available slot with the shortest duration
    const minDuration = Math.min(...durations);
    const slots = getAvailableSlots(date, availability, blockedSlots, existingLessons, minDuration);
    return slots.some(slot => slot.available);
}

/**
 * Format a date to a display string
 */
export function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Get the month string for a date (YYYY-MM format)
 */
export function getMonthString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
}

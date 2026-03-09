/**
 * Mappatura snake_case (DB) <-> camelCase (app)
 */

import type {
  User,
  Student,
  Course,
  CourseEnrollment,
  Attendance,
  Payment,
  Event,
} from '../types/database';

export type DbProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DbStudent = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  photo_url: string | null;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DbCourse = {
  id: string;
  name: string;
  description: string | null;
  teacher_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_students: number;
  room: string | null;
  is_active: boolean;
  created_at: string;
};

export type DbEnrollment = {
  id: string;
  course_id: string;
  student_id: string;
  enrolled_at: string;
  is_active: boolean;
};

export type DbAttendance = {
  id: string;
  course_id: string;
  student_id: string;
  session_date: string;
  session_start_time: string;
  status: string;
  absence_reason: string | null;
  marked_at: string | null;
  marked_by: string | null;
};

export type DbPayment = {
  id: string;
  student_id: string;
  amount: number;
  description: string;
  due_date: string;
  status: string;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
};

export type DbEvent = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  is_public: boolean;
  created_at: string;
  created_by: string;
};

function timeToHHmm(t: string | null | undefined): string {
  if (!t) return '00:00';
  if (typeof t === 'string' && t.match(/^\d{2}:\d{2}/)) return t.slice(0, 5);
  return String(t);
}

export function dbProfileToUser(p: DbProfile): User {
  return {
    id: p.id,
    email: p.email,
    role: p.role as User['role'],
    fullName: p.full_name,
    avatarUrl: p.avatar_url ?? undefined,
    createdAt: p.created_at,
  };
}

export function dbStudentToStudent(s: DbStudent): Student {
  return {
    id: s.id,
    userId: s.user_id,
    firstName: s.first_name,
    lastName: s.last_name,
    dateOfBirth: s.date_of_birth,
    photoUrl: s.photo_url ?? undefined,
    parentName: s.parent_name,
    parentPhone: s.parent_phone,
    parentEmail: s.parent_email,
    notes: s.notes ?? undefined,
    isActive: s.is_active,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

export function dbCourseToCourse(c: DbCourse): Course {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? undefined,
    teacherName: c.teacher_name,
    dayOfWeek: c.day_of_week,
    startTime: timeToHHmm(c.start_time),
    endTime: timeToHHmm(c.end_time),
    schedules: [{ dayOfWeek: c.day_of_week, startTime: timeToHHmm(c.start_time), endTime: timeToHHmm(c.end_time) }],
    maxStudents: c.max_students,
    room: c.room ?? undefined,
    isActive: c.is_active,
    createdAt: c.created_at,
  };
}

export function dbEnrollmentToEnrollment(e: DbEnrollment): CourseEnrollment {
  return {
    id: e.id,
    courseId: e.course_id,
    studentId: e.student_id,
    enrolledAt: e.enrolled_at,
    isActive: e.is_active,
  };
}

export function dbAttendanceToAttendance(a: DbAttendance): Attendance {
  return {
    id: a.id,
    courseId: a.course_id,
    studentId: a.student_id,
    sessionDate: a.session_date,
    sessionStartTime: timeToHHmm(a.session_start_time),
    status: a.status as Attendance['status'],
    absenceReason: a.absence_reason ?? undefined,
    markedAt: a.marked_at ?? undefined,
    markedBy: a.marked_by ?? undefined,
  };
}

export function dbPaymentToPayment(p: DbPayment): Payment {
  return {
    id: p.id,
    studentId: p.student_id,
    amount: Number(p.amount),
    description: p.description,
    dueDate: p.due_date,
    status: p.status as Payment['status'],
    paidAt: p.paid_at ?? undefined,
    paymentReference: p.payment_reference ?? undefined,
    createdAt: p.created_at,
  };
}

export function dbEventToEvent(e: DbEvent): Event {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: e.event_date,
    eventTime: e.event_time ? timeToHHmm(e.event_time) : undefined,
    location: e.location ?? undefined,
    isPublic: e.is_public,
    createdAt: e.created_at,
    createdBy: e.created_by,
  };
}

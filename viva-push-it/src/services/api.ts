/**
 * API Supabase per viva.push.it
 * Tutte le operazioni CRUD verso il database reale
 */

import { supabase } from '../lib/supabase';
import {
  dbProfileToUser,
  dbStudentToStudent,
  dbCourseToCourse,
  dbEnrollmentToEnrollment,
  dbAttendanceToAttendance,
  dbPaymentToPayment,
  dbEventToEvent,
} from '../lib/dbMappers';
import type {
  User,
  Student,
  Course,
  CourseEnrollment,
  Attendance,
  Payment,
  Event,
} from '../types/database';

function ensureSupabase() {
  if (!supabase) throw new Error('Supabase non configurato. Aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env');
  return supabase;
}

// --- Profiles / Users ---
export async function fetchProfile(userId: string): Promise<User | null> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return null;
  return dbProfileToUser(data);
}

export async function fetchAllProfiles(): Promise<User[]> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbProfileToUser);
}

export async function updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string; role?: string }): Promise<void> {
  const sb = ensureSupabase();
  const { error } = await sb.from('profiles').update({
    full_name: updates.full_name,
    avatar_url: updates.avatar_url,
    role: updates.role,
    updated_at: new Date().toISOString(),
  }).eq('id', userId);
  if (error) throw error;
}

// --- Students ---
export async function fetchStudents(): Promise<Student[]> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('students').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbStudentToStudent);
}

export async function addStudent(s: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('students').insert({
    user_id: s.userId,
    first_name: s.firstName,
    last_name: s.lastName,
    date_of_birth: s.dateOfBirth,
    photo_url: s.photoUrl ?? null,
    parent_name: s.parentName,
    parent_phone: s.parentPhone,
    parent_email: s.parentEmail,
    notes: s.notes ?? null,
    is_active: s.isActive,
  }).select().single();
  if (error) throw error;
  return dbStudentToStudent(data);
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<void> {
  const sb = ensureSupabase();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.firstName != null) payload.first_name = updates.firstName;
  if (updates.lastName != null) payload.last_name = updates.lastName;
  if (updates.dateOfBirth != null) payload.date_of_birth = updates.dateOfBirth;
  if (updates.photoUrl != null) payload.photo_url = updates.photoUrl;
  if (updates.parentName != null) payload.parent_name = updates.parentName;
  if (updates.parentPhone != null) payload.parent_phone = updates.parentPhone;
  if (updates.parentEmail != null) payload.parent_email = updates.parentEmail;
  if (updates.notes != null) payload.notes = updates.notes;
  if (updates.isActive != null) payload.is_active = updates.isActive;
  const { error } = await sb.from('students').update(payload).eq('id', id);
  if (error) throw error;
}

// --- Courses ---
export async function fetchCourses(): Promise<Course[]> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('courses').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map(dbCourseToCourse);
}

// --- Enrollments ---
export async function fetchEnrollments(): Promise<CourseEnrollment[]> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('course_enrollments').select('*');
  if (error) throw error;
  return (data ?? []).map(dbEnrollmentToEnrollment);
}

export async function addEnrollment(e: Omit<CourseEnrollment, 'id'>): Promise<CourseEnrollment> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('course_enrollments').insert({
    course_id: e.courseId,
    student_id: e.studentId,
    enrolled_at: e.enrolledAt,
    is_active: e.isActive,
  }).select().single();
  if (error) throw error;
  return dbEnrollmentToEnrollment(data);
}

export async function removeEnrollment(courseId: string, studentId: string): Promise<void> {
  const sb = ensureSupabase();
  const { error } = await sb.from('course_enrollments').delete().eq('course_id', courseId).eq('student_id', studentId);
  if (error) throw error;
}

// --- Attendances ---
export async function fetchAttendances(): Promise<Attendance[]> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('attendances').select('*').order('session_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbAttendanceToAttendance);
}

export async function upsertAttendance(
  courseId: string,
  studentId: string,
  sessionDate: string,
  sessionStartTime: string,
  status: Attendance['status'],
  reason?: string,
  markedBy?: string
): Promise<void> {
  const sb = ensureSupabase();
  const { data: existing } = await sb.from('attendances')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', studentId)
    .eq('session_date', sessionDate)
    .maybeSingle();

  const payload = {
    course_id: courseId,
    student_id: studentId,
    session_date: sessionDate,
    session_start_time: sessionStartTime,
    status,
    absence_reason: reason ?? null,
    marked_at: new Date().toISOString(),
    marked_by: markedBy ?? null,
  };

  if (existing) {
    const { error } = await sb.from('attendances').update(payload).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from('attendances').insert(payload);
    if (error) throw error;
  }
}

// --- Payments ---
export async function fetchPayments(): Promise<Payment[]> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('payments').select('*').order('due_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbPaymentToPayment);
}

export async function updatePaymentStatus(id: string, status: Payment['status'], reference?: string): Promise<void> {
  const sb = ensureSupabase();
  const payload: Record<string, unknown> = { status };
  if (status === 'paid') {
    payload.paid_at = new Date().toISOString();
    if (reference) payload.payment_reference = reference;
  }
  const { error } = await sb.from('payments').update(payload).eq('id', id);
  if (error) throw error;
}

// --- Events ---
export async function fetchEvents(): Promise<Event[]> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('events').select('*').order('event_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(dbEventToEvent);
}

export async function addEvent(e: Omit<Event, 'id' | 'createdAt' | 'createdBy'>, createdBy: string): Promise<Event> {
  const sb = ensureSupabase();
  const { data, error } = await sb.from('events').insert({
    title: e.title,
    description: e.description,
    event_date: e.eventDate,
    event_time: e.eventTime ?? null,
    location: e.location ?? null,
    is_public: e.isPublic,
    created_by: createdBy,
  }).select().single();
  if (error) throw error;
  return dbEventToEvent(data);
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  const sb = ensureSupabase();
  const payload: Record<string, unknown> = {};
  if (updates.title != null) payload.title = updates.title;
  if (updates.description != null) payload.description = updates.description;
  if (updates.eventDate != null) payload.event_date = updates.eventDate;
  if (updates.eventTime != null) payload.event_time = updates.eventTime;
  if (updates.location != null) payload.location = updates.location;
  if (updates.isPublic != null) payload.is_public = updates.isPublic;
  if (Object.keys(payload).length === 0) return;
  const { error } = await sb.from('events').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const sb = ensureSupabase();
  const { error } = await sb.from('events').delete().eq('id', id);
  if (error) throw error;
}

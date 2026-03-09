/**
 * API verso backend SQLite (Express)
 * Usato quando VITE_API_URL è configurato
 */

import { apiClient, getAvatarUrl } from '../lib/apiClient';
import type {
  User,
  Student,
  Course,
  CourseEnrollment,
  Attendance,
  Payment,
  Event,
} from '../types/database';

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');

async function api<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const token = apiClient.getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
  return data as T;
}

// --- Auth ---
export async function loginBackend(email: string, password: string, rememberMe: boolean): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const data = await api<{ success: boolean; user: User; token: string; error?: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    if (!data.success) return { success: false, error: data.error || 'Login fallito' };
    apiClient.setToken(data.token, rememberMe);
    const user: User = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      fullName: data.user.fullName,
      avatarUrl: data.user.avatarUrl,
      createdAt: data.user.createdAt,
    };
    return { success: true, user };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Errore di connessione' };
  }
}

export async function fetchProfileBackend(): Promise<User | null> {
  try {
    const data = await api<{ user: User }>('/api/auth/me');
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function updateOwnProfileBackend(fullName: string, phone?: string): Promise<User> {
  const data = await api<{ user: User }>('/api/auth/profile', {
    method: 'PATCH',
    body: { fullName, phone },
  });
  return data.user;
}

export async function changePasswordBackend(currentPassword: string, newPassword: string): Promise<void> {
  await api('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export async function resetUserPasswordBackend(userId: string, newPassword: string): Promise<void> {
  await api(`/api/profiles/${userId}/password`, {
    method: 'PATCH',
    body: { newPassword },
  });
}

export async function uploadAvatarBackend(file: File): Promise<{ avatarUrl: string }> {
  const token = apiClient.getToken();
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await fetch(`${API_URL}/api/auth/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
  return { avatarUrl: data.avatarUrl };
}

export async function removeAvatarBackend(): Promise<void> {
  await api('/api/auth/avatar', { method: 'DELETE' });
}

export { getAvatarUrl };

export async function fetchAllProfilesBackend(): Promise<User[]> {
  return api<User[]>('/api/profiles');
}

export async function deleteProfileBackend(userId: string): Promise<void> {
  await api(`/api/profiles/${userId}`, { method: 'DELETE' });
}

export async function updateProfileBackend(userId: string, updates: { full_name?: string; phone?: string; role?: string }): Promise<void> {
  const body: Record<string, string> = {};
  if (updates.full_name != null) body.fullName = updates.full_name;
  if (updates.phone != null) body.phone = updates.phone;
  if (updates.role != null) body.role = updates.role;
  await api(`/api/profiles/${userId}`, { method: 'PATCH', body });
}

export async function createProfileBackend(data: { email: string; password: string; fullName: string; phone?: string; role?: string }): Promise<User> {
  const created = await api<User & { id: string }>('/api/profiles', {
    method: 'POST',
    body: { ...data, role: data.role || 'user' },
  });
  return { ...created, avatarUrl: undefined };
}

// --- Students ---
export async function fetchStudentsBackend(): Promise<Student[]> {
  return api<Student[]>('/api/students');
}

export async function addStudentBackend(s: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
  const body = {
    userId: s.userId,
    firstName: s.firstName,
    lastName: s.lastName,
    dateOfBirth: s.dateOfBirth,
    parentName: s.parentName,
    parentPhone: s.parentPhone,
    parentEmail: s.parentEmail,
    notes: s.notes,
    photoUrl: s.photoUrl,
    isActive: s.isActive,
  };
  return api<Student>('/api/students', { method: 'POST', body });
}

export async function updateStudentBackend(id: string, updates: Partial<Student>): Promise<void> {
  await api(`/api/students/${id}`, { method: 'PATCH', body: updates });
}

// --- Courses ---
export async function fetchCoursesBackend(): Promise<Course[]> {
  return api<Course[]>('/api/courses');
}

export async function addCourseBackend(c: Omit<Course, 'id' | 'createdAt'>): Promise<Course> {
  const body = {
    name: c.name,
    description: c.description,
    teacherName: c.teacherName,
    dayOfWeek: c.dayOfWeek,
    startTime: c.startTime,
    endTime: c.endTime,
    maxStudents: c.maxStudents ?? 10,
    room: c.room,
    isActive: c.isActive ?? true,
  };
  return api<Course>('/api/courses', { method: 'POST', body });
}

export async function updateCourseBackend(id: string, updates: Partial<Course>): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.name != null) body.name = updates.name;
  if (updates.description != null) body.description = updates.description;
  if (updates.teacherName != null) body.teacherName = updates.teacherName;
  if (updates.dayOfWeek != null) body.dayOfWeek = updates.dayOfWeek;
  if (updates.startTime != null) body.startTime = updates.startTime;
  if (updates.endTime != null) body.endTime = updates.endTime;
  if (updates.maxStudents != null) body.maxStudents = updates.maxStudents;
  if (updates.room != null) body.room = updates.room;
  if (updates.isActive != null) body.isActive = updates.isActive;
  await api(`/api/courses/${id}`, { method: 'PATCH', body });
}

export async function deleteCourseBackend(id: string): Promise<void> {
  await api(`/api/courses/${id}`, { method: 'DELETE' });
}

// --- Enrollments ---
export async function fetchEnrollmentsBackend(): Promise<CourseEnrollment[]> {
  return api<CourseEnrollment[]>('/api/enrollments');
}

export async function addEnrollmentBackend(e: Omit<CourseEnrollment, 'id'>): Promise<CourseEnrollment> {
  return api<CourseEnrollment>('/api/enrollments', { method: 'POST', body: e });
}

export async function removeEnrollmentBackend(courseId: string, studentId: string): Promise<void> {
  await api(`/api/enrollments?courseId=${courseId}&studentId=${studentId}`, { method: 'DELETE' });
}

// --- Attendances ---
export async function fetchAttendancesBackend(): Promise<Attendance[]> {
  return api<Attendance[]>('/api/attendances');
}

export async function upsertAttendanceBackend(
  courseId: string,
  studentId: string,
  sessionDate: string,
  sessionStartTime: string,
  status: Attendance['status'],
  reason?: string,
  _markedBy?: string
): Promise<void> {
  await api('/api/attendances', {
    method: 'PUT',
    body: { courseId, studentId, sessionDate, sessionStartTime, status, absenceReason: reason },
  });
}

// --- Payments ---
export async function fetchPaymentsBackend(): Promise<Payment[]> {
  return api<Payment[]>('/api/payments');
}

export async function addPaymentBackend(p: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  const body = {
    studentId: p.studentId,
    amount: p.amount,
    description: p.description,
    dueDate: p.dueDate,
    status: p.status ?? 'pending',
  };
  return api<Payment>('/api/payments', { method: 'POST', body });
}

export async function updatePaymentBackend(id: string, updates: Partial<Payment>): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.studentId != null) body.studentId = updates.studentId;
  if (updates.amount != null) body.amount = updates.amount;
  if (updates.description != null) body.description = updates.description;
  if (updates.dueDate != null) body.dueDate = updates.dueDate;
  if (updates.status != null) body.status = updates.status;
  if (updates.paymentReference != null) body.paymentReference = updates.paymentReference;
  await api(`/api/payments/${id}`, { method: 'PATCH', body });
}

export async function updatePaymentStatusBackend(id: string, status: Payment['status'], reference?: string): Promise<void> {
  await api(`/api/payments/${id}`, { method: 'PATCH', body: { status, paymentReference: reference } });
}

export async function deletePaymentBackend(id: string): Promise<void> {
  await api(`/api/payments/${id}`, { method: 'DELETE' });
}

// --- Events ---
export async function fetchEventsBackend(): Promise<Event[]> {
  return api<Event[]>('/api/events');
}

export async function addEventBackend(e: Omit<Event, 'id' | 'createdAt' | 'createdBy'>, _createdBy: string): Promise<Event> {
  return api<Event>('/api/events', { method: 'POST', body: e });
}

export async function updateEventBackend(id: string, updates: Partial<Event>): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.title != null) body.title = updates.title;
  if (updates.description != null) body.description = updates.description;
  if (updates.eventDate != null) body.eventDate = updates.eventDate;
  if (updates.eventTime != null) body.eventTime = updates.eventTime;
  if (updates.location != null) body.location = updates.location;
  if (updates.isPublic != null) body.isPublic = updates.isPublic;
  await api(`/api/events/${id}`, { method: 'PATCH', body });
}

export async function deleteEventBackend(id: string): Promise<void> {
  await api(`/api/events/${id}`, { method: 'DELETE' });
}

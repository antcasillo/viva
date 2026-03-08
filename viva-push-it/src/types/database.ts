/**
 * Schema del database per viva.push.it
 * Scuola di Musica - Gestione Allievi, Corsi, Presenze, Pagamenti, Eventi
 */

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string; // Riferimento al genitore/titolare
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  photoUrl?: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  teacherName: string;
  dayOfWeek: number; // 0 = Domenica, 1 = Lunedì, etc.
  startTime: string; // HH:mm
  endTime: string;
  maxStudents: number;
  room?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: string;
  isActive: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'absent_preavvisato' | 'unknown';

export interface Attendance {
  id: string;
  courseId: string;
  studentId: string;
  sessionDate: string; // YYYY-MM-DD
  sessionStartTime: string;
  status: AttendanceStatus;
  absenceReason?: string; // Compilato dal genitore se preavvisato
  markedAt?: string;
  markedBy?: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'expired' | 'cancelled';

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  description: string;
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string;
  paymentReference?: string; // ID transazione SumUp
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  isPublic: boolean;
  createdAt: string;
  createdBy: string;
}

// Estensioni per le query con join
export interface StudentWithCourses extends Student {
  courses: Course[];
}

export interface CourseWithStudents extends Course {
  students: Student[];
  enrollments: CourseEnrollment[];
}

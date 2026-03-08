/**
 * Mock Data per viva.push.it
 * Dati fittizi per testare l'interfaccia
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

// Utenti per login (Admin e Utenti/Genitori)
export const mockUsers: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@vivapush.it',
    role: 'admin',
    fullName: 'Maria Rossi',
    avatarUrl: undefined,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-1',
    email: 'genitore.bianchi@gmail.com',
    role: 'user',
    fullName: 'Giuseppe Bianchi',
    phone: '+39 333 1234567',
    createdAt: '2024-02-01T09:00:00Z',
  },
  {
    id: 'user-2',
    email: 'anna.verdi@email.it',
    role: 'user',
    fullName: 'Anna Verdi',
    phone: '+39 340 9876543',
    createdAt: '2024-02-10T11:00:00Z',
  },
  {
    id: 'user-3',
    email: 'marco.neri@outlook.com',
    role: 'user',
    fullName: 'Marco Neri',
    phone: '+39 328 5551234',
    createdAt: '2024-02-15T14:00:00Z',
  },
  {
    id: 'user-4',
    email: 'laura.gialli@gmail.com',
    role: 'user',
    fullName: 'Laura Gialli',
    phone: '+39 366 7778899',
    createdAt: '2024-03-01T08:00:00Z',
  },
  {
    id: 'user-5',
    email: 'paolo.rossi@email.it',
    role: 'user',
    fullName: 'Paolo Rossi',
    phone: '+39 347 2223344',
    createdAt: '2024-03-05T16:00:00Z',
  },
];

// 5+ Allievi
export const mockStudents: Student[] = [
  {
    id: 'student-1',
    userId: 'user-1',
    firstName: 'Luca',
    lastName: 'Bianchi',
    dateOfBirth: '2015-03-22',
    photoUrl: '/avatars/luca.jpg',
    parentName: 'Giuseppe Bianchi',
    parentPhone: '+39 333 1234567',
    parentEmail: 'genitore.bianchi@gmail.com',
    notes: 'Preferisce pianoforte',
    isActive: true,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'student-2',
    userId: 'user-2',
    firstName: 'Sofia',
    lastName: 'Verdi',
    dateOfBirth: '2016-07-14',
    photoUrl: '/avatars/sofia.jpg',
    parentName: 'Anna Verdi',
    parentPhone: '+39 340 9876543',
    parentEmail: 'anna.verdi@email.it',
    isActive: true,
    createdAt: '2024-02-10T11:00:00Z',
    updatedAt: '2024-02-10T11:00:00Z',
  },
  {
    id: 'student-3',
    userId: 'user-3',
    firstName: 'Matteo',
    lastName: 'Neri',
    dateOfBirth: '2014-11-08',
    parentName: 'Marco Neri',
    parentPhone: '+39 328 5551234',
    parentEmail: 'marco.neri@outlook.com',
    notes: 'Livello avanzato chitarra',
    isActive: true,
    createdAt: '2024-02-15T14:00:00Z',
    updatedAt: '2024-02-20T09:00:00Z',
  },
  {
    id: 'student-4',
    userId: 'user-4',
    firstName: 'Emma',
    lastName: 'Gialli',
    dateOfBirth: '2017-01-30',
    photoUrl: '/avatars/emma.jpg',
    parentName: 'Laura Gialli',
    parentPhone: '+39 366 7778899',
    parentEmail: 'laura.gialli@gmail.com',
    isActive: true,
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z',
  },
  {
    id: 'student-5',
    userId: 'user-5',
    firstName: 'Alessandro',
    lastName: 'Rossi',
    dateOfBirth: '2015-09-12',
    parentName: 'Paolo Rossi',
    parentPhone: '+39 347 2223344',
    parentEmail: 'paolo.rossi@email.it',
    isActive: true,
    createdAt: '2024-03-05T16:00:00Z',
    updatedAt: '2024-03-05T16:00:00Z',
  },
];

// 3 Corsi con orari differenti
export const mockCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Pianoforte Principianti',
    description: 'Corso base per bambini 6-10 anni',
    teacherName: 'Prof. Elena Martini',
    dayOfWeek: 1, // Lunedì
    startTime: '16:00',
    endTime: '17:00',
    maxStudents: 8,
    room: 'Aula 1',
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'course-2',
    name: 'Chitarra Avanzata',
    description: 'Per allievi con almeno 2 anni di esperienza',
    teacherName: 'Maestro Carlo Bianchi',
    dayOfWeek: 3, // Mercoledì
    startTime: '17:30',
    endTime: '18:30',
    maxStudents: 6,
    room: 'Aula 2',
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'course-3',
    name: 'Canto Corale',
    description: 'Laboratorio di canto per bambini e ragazzi',
    teacherName: 'Prof.ssa Francesca Neri',
    dayOfWeek: 5, // Venerdì
    startTime: '15:00',
    endTime: '16:30',
    maxStudents: 12,
    room: 'Sala Concerti',
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z',
  },
];

// Iscrizioni ai corsi
export const mockEnrollments: CourseEnrollment[] = [
  { id: 'enr-1', courseId: 'course-1', studentId: 'student-1', enrolledAt: '2024-02-01', isActive: true },
  { id: 'enr-2', courseId: 'course-1', studentId: 'student-2', enrolledAt: '2024-02-10', isActive: true },
  { id: 'enr-3', courseId: 'course-1', studentId: 'student-4', enrolledAt: '2024-03-01', isActive: true },
  { id: 'enr-4', courseId: 'course-2', studentId: 'student-3', enrolledAt: '2024-02-15', isActive: true },
  { id: 'enr-5', courseId: 'course-2', studentId: 'student-1', enrolledAt: '2024-02-20', isActive: true },
  { id: 'enr-6', courseId: 'course-3', studentId: 'student-2', enrolledAt: '2024-02-10', isActive: true },
  { id: 'enr-7', courseId: 'course-3', studentId: 'student-3', enrolledAt: '2024-02-15', isActive: true },
  { id: 'enr-8', courseId: 'course-3', studentId: 'student-5', enrolledAt: '2024-03-05', isActive: true },
];

// Storico presenze misto (con alcune preavvisate)
const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

export const mockAttendances: Attendance[] = [
  // Lunedì scorso - Pianoforte
  { id: 'att-1', courseId: 'course-1', studentId: 'student-1', sessionDate: twoDaysAgo, sessionStartTime: '16:00', status: 'present', markedAt: twoDaysAgo + 'T16:05:00Z', markedBy: 'user-admin-1' },
  { id: 'att-2', courseId: 'course-1', studentId: 'student-2', sessionDate: twoDaysAgo, sessionStartTime: '16:00', status: 'absent_preavvisato', absenceReason: 'Influenza', markedAt: twoDaysAgo + 'T15:30:00Z' },
  { id: 'att-3', courseId: 'course-1', studentId: 'student-4', sessionDate: twoDaysAgo, sessionStartTime: '16:00', status: 'present', markedAt: twoDaysAgo + 'T16:02:00Z', markedBy: 'user-admin-1' },
  // Mercoledì scorso - Chitarra
  { id: 'att-4', courseId: 'course-2', studentId: 'student-3', sessionDate: yesterday, sessionStartTime: '17:30', status: 'present', markedAt: yesterday + 'T17:35:00Z', markedBy: 'user-admin-1' },
  { id: 'att-5', courseId: 'course-2', studentId: 'student-1', sessionDate: yesterday, sessionStartTime: '17:30', status: 'absent', markedAt: yesterday + 'T18:00:00Z', markedBy: 'user-admin-1' },
  // Oggi - Canto (alcune da segnare)
  { id: 'att-6', courseId: 'course-3', studentId: 'student-2', sessionDate: today, sessionStartTime: '15:00', status: 'absent_preavvisato', absenceReason: 'Gita scolastica' },
  { id: 'att-7', courseId: 'course-3', studentId: 'student-3', sessionDate: today, sessionStartTime: '15:00', status: 'unknown' },
  { id: 'att-8', courseId: 'course-3', studentId: 'student-5', sessionDate: today, sessionStartTime: '15:00', status: 'unknown' },
];

// 4 Rette: 2 pagate, 1 in attesa, 1 scaduta
export const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    studentId: 'student-1',
    amount: 80,
    description: 'Retta Marzo 2024 - Pianoforte + Chitarra',
    dueDate: '2024-03-10',
    status: 'paid',
    paidAt: '2024-03-05T14:30:00Z',
    paymentReference: 'SUMUP-TXN-001',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'pay-2',
    studentId: 'student-2',
    amount: 60,
    description: 'Retta Marzo 2024 - Pianoforte',
    dueDate: '2024-03-10',
    status: 'paid',
    paidAt: '2024-03-02T09:15:00Z',
    paymentReference: 'SUMUP-TXN-002',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'pay-3',
    studentId: 'student-3',
    amount: 70,
    description: 'Retta Marzo 2024 - Chitarra + Canto',
    dueDate: '2024-03-10',
    status: 'pending',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: 'pay-4',
    studentId: 'student-4',
    amount: 60,
    description: 'Retta Febbraio 2024 - Pianoforte',
    dueDate: '2024-02-28',
    status: 'expired',
    createdAt: '2024-02-01T10:00:00Z',
  },
];

// 3 Eventi futuri in bacheca
const futureDate1 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
const futureDate2 = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];
const futureDate3 = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];

export const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Saggio di Primavera',
    description: 'Esibizione degli allievi dei corsi di pianoforte e chitarra. Ingresso libero per familiari.',
    eventDate: futureDate1,
    eventTime: '17:00',
    location: 'Sala Concerti - Via Roma 15',
    isPublic: true,
    createdAt: '2024-03-01T10:00:00Z',
    createdBy: 'user-admin-1',
  },
  {
    id: 'event-2',
    title: 'Chiusura per Festività',
    description: 'La scuola resterà chiusa per le festività pasquali. Le lezioni riprenderanno regolarmente il 2 aprile.',
    eventDate: futureDate2,
    eventTime: undefined,
    location: undefined,
    isPublic: true,
    createdAt: '2024-03-01T10:00:00Z',
    createdBy: 'user-admin-1',
  },
  {
    id: 'event-3',
    title: 'Concerto di Fine Anno',
    description: 'Grande concerto di fine anno con tutti i corsi. Prenotazione posti obbligatoria.',
    eventDate: futureDate3,
    eventTime: '18:30',
    location: 'Teatro Comunale',
    isPublic: true,
    createdAt: '2024-03-01T10:00:00Z',
    createdBy: 'user-admin-1',
  },
];

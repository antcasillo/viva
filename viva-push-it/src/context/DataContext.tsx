import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Student, Course, CourseEnrollment, Attendance, Payment, Event } from '../types/database';
import {
  mockStudents,
  mockCourses,
  mockEnrollments,
  mockAttendances,
  mockPayments,
  mockEvents,
} from '../data/mockData';

type DataContextType = {
  students: Student[];
  courses: Course[];
  enrollments: CourseEnrollment[];
  attendances: Attendance[];
  payments: Payment[];
  events: Event[];
  addStudent: (s: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStudent: (id: string, s: Partial<Student>) => void;
  setStudentActive: (id: string, active: boolean) => void;
  addEnrollment: (e: Omit<CourseEnrollment, 'id'>) => void;
  removeEnrollment: (courseId: string, studentId: string) => void;
  setAttendance: (courseId: string, studentId: string, sessionDate: string, status: Attendance['status'], reason?: string) => void;
  addEvent: (e: Omit<Event, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateEvent: (id: string, e: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  updatePaymentStatus: (id: string, status: Payment['status'], reference?: string) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [courses] = useState<Course[]>(mockCourses);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(mockEnrollments);
  const [attendances, setAttendances] = useState<Attendance[]>(mockAttendances);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [events, setEvents] = useState<Event[]>(mockEvents);

  const addStudent = useCallback((s: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setStudents((prev) => [
      ...prev,
      { ...s, id: generateId(), createdAt: now, updatedAt: now } as Student,
    ]);
  }, []);

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
  }, []);

  const setStudentActive = useCallback((id: string, active: boolean) => {
    updateStudent(id, { isActive: active });
  }, [updateStudent]);

  const addEnrollment = useCallback((e: Omit<CourseEnrollment, 'id'>) => {
    if (enrollments.some((x) => x.courseId === e.courseId && x.studentId === e.studentId)) return;
    setEnrollments((prev) => [...prev, { ...e, id: generateId() }]);
  }, [enrollments]);

  const removeEnrollment = useCallback((courseId: string, studentId: string) => {
    setEnrollments((prev) => prev.filter((x) => !(x.courseId === courseId && x.studentId === studentId)));
  }, []);

  const setAttendance = useCallback(
    (courseId: string, studentId: string, sessionDate: string, status: Attendance['status'], reason?: string) => {
      setAttendances((prev) => {
        const existing = prev.find(
          (a) => a.courseId === courseId && a.studentId === studentId && a.sessionDate === sessionDate
        );
        const upd = {
          id: existing?.id ?? generateId(),
          courseId,
          studentId,
          sessionDate,
          sessionStartTime: existing?.sessionStartTime ?? '09:00',
          status,
          absenceReason: reason,
          markedAt: new Date().toISOString(),
          markedBy: 'user-admin-1',
        };
        if (existing) {
          return prev.map((a) => (a.id === existing.id ? upd : a));
        }
        return [...prev, upd];
      });
    },
    []
  );

  const addEvent = useCallback((e: Omit<Event, 'id' | 'createdAt' | 'createdBy'>) => {
    setEvents((prev) => [
      ...prev,
      { ...e, id: generateId(), createdAt: new Date().toISOString(), createdBy: 'user-admin-1' },
    ]);
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updatePaymentStatus = useCallback((id: string, status: Payment['status'], reference?: string) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined, paymentReference: reference }
          : p
      )
    );
  }, []);

  return (
    <DataContext.Provider
      value={{
        students,
        courses,
        enrollments,
        attendances,
        payments,
        events,
        addStudent,
        updateStudent,
        setStudentActive,
        addEnrollment,
        removeEnrollment,
        setAttendance,
        addEvent,
        updateEvent,
        deleteEvent,
        updatePaymentStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

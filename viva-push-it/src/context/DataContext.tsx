import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Student, Course, CourseEnrollment, Attendance, Payment, Event } from '../types/database';
import { isBackendConfigured } from '../lib/apiClient';
import { useAuth } from './AuthContext';
import * as apiBackend from '../services/apiBackend';

type DataContextType = {
  students: Student[];
  courses: Course[];
  enrollments: CourseEnrollment[];
  attendances: Attendance[];
  payments: Payment[];
  events: Event[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addStudent: (s: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateStudent: (id: string, s: Partial<Student>) => Promise<void>;
  setStudentActive: (id: string, active: boolean) => Promise<void>;
  addCourse: (c: Omit<Course, 'id' | 'createdAt'>) => Promise<void>;
  updateCourse: (id: string, c: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addEnrollment: (e: Omit<CourseEnrollment, 'id'>) => Promise<void>;
  removeEnrollment: (courseId: string, studentId: string) => Promise<void>;
  setAttendance: (courseId: string, studentId: string, sessionDate: string, status: Attendance['status'], reason?: string, sessionStartTime?: string) => Promise<void>;
  addEvent: (e: Omit<Event, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateEvent: (id: string, e: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addPayment: (p: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (id: string, p: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  updatePaymentStatus: (id: string, status: Payment['status'], reference?: string) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const useDb = isBackendConfigured();
  const { user } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(useDb);
  const [error, setError] = useState<string | null>(null);

  const loadFromDb = useCallback(async () => {
    if (!useDb) return;
    if (useDb && !user) return; // Con backend: carica solo se autenticato
    setIsLoading(true);
    setError(null);
    try {
      const [s, c, e, a, p, ev] = await Promise.all([
        apiBackend.fetchStudentsBackend(),
        apiBackend.fetchCoursesBackend(),
        apiBackend.fetchEnrollmentsBackend(),
        apiBackend.fetchAttendancesBackend(),
        apiBackend.fetchPaymentsBackend(),
        apiBackend.fetchEventsBackend(),
      ]);
      setStudents(s);
      setCourses(c);
      setEnrollments(e);
      setAttendances(a);
      setPayments(p);
      setEvents(ev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento dati');
    } finally {
      setIsLoading(false);
    }
  }, [useDb, user]);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb, user?.id]);

  const refresh = useCallback(() => loadFromDb(), [loadFromDb]);

  const addStudent = useCallback(async (s: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (useDb) {
      const created = await apiBackend.addStudentBackend(s);
      setStudents((prev) => [...prev, created]);
    } else {
      const now = new Date().toISOString();
      setStudents((prev) => [...prev, { ...s, id: generateId(), createdAt: now, updatedAt: now } as Student]);
    }
  }, [useDb]);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    if (useDb) {
      await apiBackend.updateStudentBackend(id, updates);
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)));
    } else {
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)));
    }
  }, [useDb]);

  const setStudentActive = useCallback(async (id: string, active: boolean) => {
    await updateStudent(id, { isActive: active });
  }, [updateStudent]);

  const addCourse = useCallback(async (c: Omit<Course, 'id' | 'createdAt'>) => {
    if (useDb) {
      const created = await apiBackend.addCourseBackend(c);
      setCourses((prev) => [...prev, created]);
    } else {
      setCourses((prev) => [...prev, { ...c, id: generateId(), createdAt: new Date().toISOString() } as Course]);
    }
  }, [useDb]);

  const updateCourse = useCallback(async (id: string, updates: Partial<Course>) => {
    if (useDb) await apiBackend.updateCourseBackend(id, updates);
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, [useDb]);

  const deleteCourse = useCallback(async (id: string) => {
    if (useDb) await apiBackend.deleteCourseBackend(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, [useDb]);

  const addEnrollment = useCallback(async (e: Omit<CourseEnrollment, 'id'>) => {
    if (enrollments.some((x) => x.courseId === e.courseId && x.studentId === e.studentId)) return;
    if (useDb) {
      const created = await apiBackend.addEnrollmentBackend(e);
      setEnrollments((prev) => [...prev, created]);
    } else {
      setEnrollments((prev) => [...prev, { ...e, id: generateId() }]);
    }
  }, [useDb, enrollments]);

  const removeEnrollment = useCallback(async (courseId: string, studentId: string) => {
    if (useDb) await apiBackend.removeEnrollmentBackend(courseId, studentId);
    setEnrollments((prev) => prev.filter((x) => !(x.courseId === courseId && x.studentId === studentId)));
  }, [useDb]);

  const setAttendance = useCallback(
    async (courseId: string, studentId: string, sessionDate: string, status: Attendance['status'], reason?: string, sessionStartTimeArg?: string) => {
      const existing = attendances.find(
        (a) => a.courseId === courseId && a.studentId === studentId && a.sessionDate === sessionDate
      );
      const sessionStartTime = sessionStartTimeArg ?? existing?.sessionStartTime ?? '09:00';

      if (useDb) {
        await apiBackend.upsertAttendanceBackend(courseId, studentId, sessionDate, sessionStartTime, status, reason);
        await loadFromDb();
      } else {
        const upd = {
          id: existing?.id ?? generateId(),
          courseId,
          studentId,
          sessionDate,
          sessionStartTime,
          status,
          absenceReason: reason,
          markedAt: new Date().toISOString(),
          markedBy: 'user-admin-1',
        };
        setAttendances((prev) => {
          if (existing) return prev.map((a) => (a.id === existing.id ? upd : a));
          return [...prev, upd];
        });
      }
    },
    [useDb, attendances, loadFromDb]
  );

  const addEvent = useCallback(async (e: Omit<Event, 'id' | 'createdAt' | 'createdBy'>) => {
    if (useDb) {
      const created = await apiBackend.addEventBackend(e, '');
      setEvents((prev) => [...prev, created]);
    } else {
      setEvents((prev) => [...prev, { ...e, id: generateId(), createdAt: new Date().toISOString(), createdBy: 'user-admin-1' }]);
    }
  }, [useDb]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    if (useDb) await apiBackend.updateEventBackend(id, updates);
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, ...updates } : ev)));
  }, [useDb]);

  const deleteEvent = useCallback(async (id: string) => {
    if (useDb) await apiBackend.deleteEventBackend(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, [useDb]);

  const addPayment = useCallback(async (p: Omit<Payment, 'id' | 'createdAt'>) => {
    if (useDb) {
      const created = await apiBackend.addPaymentBackend(p);
      setPayments((prev) => [...prev, created]);
    } else {
      setPayments((prev) => [...prev, { ...p, id: generateId(), createdAt: new Date().toISOString() } as Payment]);
    }
  }, [useDb]);

  const updatePayment = useCallback(async (id: string, updates: Partial<Payment>) => {
    if (useDb) await apiBackend.updatePaymentBackend(id, updates);
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...updates };
        if (updates.status === 'paid') merged.paidAt = new Date().toISOString();
        else if (updates.status != null) merged.paidAt = undefined;
        return merged;
      })
    );
  }, [useDb]);

  const deletePayment = useCallback(async (id: string) => {
    if (useDb) await apiBackend.deletePaymentBackend(id);
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, [useDb]);

  const updatePaymentStatus = useCallback(async (id: string, status: Payment['status'], reference?: string) => {
    if (useDb) await apiBackend.updatePaymentStatusBackend(id, status, reference);
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status, paidAt: status === 'paid' ? new Date().toISOString() : undefined, paymentReference: reference }
          : p
      )
    );
  }, [useDb]);

  return (
    <DataContext.Provider
      value={{
        students,
        courses,
        enrollments,
        attendances,
        payments,
        events,
        isLoading,
        error,
        refresh,
        addStudent,
        updateStudent,
        setStudentActive,
        addCourse,
        updateCourse,
        deleteCourse,
        addEnrollment,
        removeEnrollment,
        setAttendance,
        addEvent,
        updateEvent,
        deleteEvent,
        addPayment,
        updatePayment,
        deletePayment,
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

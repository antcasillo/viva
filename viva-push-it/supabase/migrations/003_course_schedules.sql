-- Tabella orari multipli per corso
CREATE TABLE IF NOT EXISTS public.course_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_course_schedules_course ON public.course_schedules(course_id);

-- Migrazione: copia orari esistenti da courses a course_schedules
INSERT INTO public.course_schedules (course_id, day_of_week, start_time, end_time)
SELECT id, day_of_week, start_time, end_time FROM public.courses;

-- RLS policies complete e trigger per profili
-- Eseguire dopo 001_initial_schema.sql

-- Trigger: crea profilo automaticamente alla registrazione
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger su auth.users (richiede permessi su schema auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rimuovi policy incomplete e ricrea
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;

-- Profiles: Admin vede tutto, User vede/modifica solo il proprio
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "profiles_user_select" ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_user_update" ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Students: Admin vede tutto e modifica; User vede solo i propri (user_id = auth.uid())
CREATE POLICY "students_admin_all" ON public.students FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "students_user_select" ON public.students FOR SELECT
  USING (user_id = auth.uid());

-- Courses: Admin gestisce tutto; User legge tutti (per vedere corsi disponibili)
CREATE POLICY "courses_admin_all" ON public.courses FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "courses_user_select" ON public.courses FOR SELECT
  USING (true);

-- Enrollments: Admin tutto; User legge solo per i propri studenti
CREATE POLICY "enrollments_admin_all" ON public.course_enrollments FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "enrollments_user_select" ON public.course_enrollments FOR SELECT
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Attendances: Admin tutto; User legge/aggiorna per i propri studenti
CREATE POLICY "attendances_admin_all" ON public.attendances FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "attendances_user_select" ON public.attendances FOR SELECT
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "attendances_user_upsert" ON public.attendances FOR ALL
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Payments: Admin tutto; User legge solo per i propri studenti
CREATE POLICY "payments_admin_all" ON public.payments FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "payments_user_select" ON public.payments FOR SELECT
  USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Events: Admin tutto; User legge eventi pubblici
CREATE POLICY "events_admin_all" ON public.events FOR ALL
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "events_user_select" ON public.events FOR SELECT
  USING (is_public = true);

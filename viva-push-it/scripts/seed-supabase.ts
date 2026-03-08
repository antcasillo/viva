/**
 * Script per popolare Supabase con dati iniziali
 * Richiede: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env
 *
 * Esegui: npm run db:seed
 *
 * Prima di eseguire:
 * 1. Crea un progetto su supabase.com
 * 2. Esegui le migration (001 + 002)
 * 3. Aggiungi VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Configura SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const USERS = [
  { email: 'admin@vivapush.it', password: 'admin123', full_name: 'Maria Rossi', role: 'admin' },
  { email: 'genitore.bianchi@gmail.com', password: 'user123', full_name: 'Giuseppe Bianchi', role: 'user' },
  { email: 'anna.verdi@email.it', password: 'user123', full_name: 'Anna Verdi', role: 'user' },
  { email: 'marco.neri@outlook.com', password: 'user123', full_name: 'Marco Neri', role: 'user' },
  { email: 'laura.gialli@gmail.com', password: 'user123', full_name: 'Laura Gialli', role: 'user' },
  { email: 'paolo.rossi@email.it', password: 'user123', full_name: 'Paolo Rossi', role: 'user' },
];

async function main() {
  console.log('🌱 Seed Supabase viva.push.it...\n');

  const userIds: Record<string, string> = {};

  for (const u of USERS) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((x) => x.email === u.email);
    if (found) {
      userIds[u.email] = found.id;
      console.log(`  ✓ Utente esistente: ${u.email}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      });
      if (error) {
        console.error(`  ✗ Errore creazione ${u.email}:`, error.message);
        continue;
      }
      userIds[u.email] = data.user.id;
      console.log(`  ✓ Creato: ${u.email}`);
    }
  }

  const adminId = userIds['admin@vivapush.it'];
  const user1Id = userIds['genitore.bianchi@gmail.com'];
  const user2Id = userIds['anna.verdi@email.it'];
  const user3Id = userIds['marco.neri@outlook.com'];
  const user4Id = userIds['laura.gialli@gmail.com'];
  const user5Id = userIds['paolo.rossi@email.it'];

  if (!adminId || !user1Id) {
    console.error('❌ Mancano utenti admin o genitore.bianchi');
    process.exit(1);
  }

  await supabase.from('profiles').update({ role: 'admin', full_name: 'Maria Rossi' }).eq('id', adminId);

  const { data: courses } = await supabase.from('courses').select('id');
  if (courses && courses.length > 0) {
    console.log('\n  ⏭ Corsi già presenti, skip.');
  } else {
    const { data: insertedCourses } = await supabase
      .from('courses')
      .insert([
        { name: 'Pianoforte Principianti', description: 'Corso base per bambini 6-10 anni', teacher_name: 'Prof. Elena Martini', day_of_week: 1, start_time: '16:00', end_time: '17:00', max_students: 8, room: 'Aula 1' },
        { name: 'Chitarra Avanzata', description: 'Per allievi con almeno 2 anni di esperienza', teacher_name: 'Maestro Carlo Bianchi', day_of_week: 3, start_time: '17:30', end_time: '18:30', max_students: 6, room: 'Aula 2' },
        { name: 'Canto Corale', description: 'Laboratorio di canto per bambini e ragazzi', teacher_name: 'Prof.ssa Francesca Neri', day_of_week: 5, start_time: '15:00', end_time: '16:30', max_students: 12, room: 'Sala Concerti' },
      ])
      .select('id');
    console.log('  ✓ Corsi creati:', insertedCourses?.length ?? 0);
  }

  const { data: allCourses } = await supabase.from('courses').select('id');
  const courseIds = (allCourses ?? []).map((c) => c.id);
  const course1 = courseIds[0];
  const course2 = courseIds[1];
  const course3 = courseIds[2];

  const { data: students } = await supabase.from('students').select('id');
  if (students && students.length > 0) {
    console.log('  ⏭ Allievi già presenti, skip.');
  } else {
    const { data: insertedStudents } = await supabase
      .from('students')
      .insert([
        { user_id: user1Id, first_name: 'Luca', last_name: 'Bianchi', date_of_birth: '2015-03-22', parent_name: 'Giuseppe Bianchi', parent_phone: '+39 333 1234567', parent_email: 'genitore.bianchi@gmail.com', notes: 'Preferisce pianoforte' },
        { user_id: user2Id, first_name: 'Sofia', last_name: 'Verdi', date_of_birth: '2016-07-14', parent_name: 'Anna Verdi', parent_phone: '+39 340 9876543', parent_email: 'anna.verdi@email.it' },
        { user_id: user3Id, first_name: 'Matteo', last_name: 'Neri', date_of_birth: '2014-11-08', parent_name: 'Marco Neri', parent_phone: '+39 328 5551234', parent_email: 'marco.neri@outlook.com', notes: 'Livello avanzato chitarra' },
        { user_id: user4Id, first_name: 'Emma', last_name: 'Gialli', date_of_birth: '2017-01-30', parent_name: 'Laura Gialli', parent_phone: '+39 366 7778899', parent_email: 'laura.gialli@gmail.com' },
        { user_id: user5Id, first_name: 'Alessandro', last_name: 'Rossi', date_of_birth: '2015-09-12', parent_name: 'Paolo Rossi', parent_phone: '+39 347 2223344', parent_email: 'paolo.rossi@email.it' },
      ])
      .select('id');
    console.log('  ✓ Allievi creati:', insertedStudents?.length ?? 0);

    const studentIds = (insertedStudents ?? []).map((s) => s.id);
    const s1 = studentIds[0];
    const s2 = studentIds[1];
    const s3 = studentIds[2];
    const s4 = studentIds[3];
    const s5 = studentIds[4];

    if (course1 && course2 && course3 && s1 && s2 && s3 && s4 && s5) {
      await supabase.from('course_enrollments').insert([
        { course_id: course1, student_id: s1, enrolled_at: '2024-02-01' },
        { course_id: course1, student_id: s2, enrolled_at: '2024-02-10' },
        { course_id: course1, student_id: s4, enrolled_at: '2024-03-01' },
        { course_id: course2, student_id: s3, enrolled_at: '2024-02-15' },
        { course_id: course2, student_id: s1, enrolled_at: '2024-02-20' },
        { course_id: course3, student_id: s2, enrolled_at: '2024-02-10' },
        { course_id: course3, student_id: s3, enrolled_at: '2024-02-15' },
        { course_id: course3, student_id: s5, enrolled_at: '2024-03-05' },
      ]);
      console.log('  ✓ Iscrizioni create');

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0];

      await supabase.from('attendances').insert([
        { course_id: course1, student_id: s1, session_date: twoDaysAgo, session_start_time: '16:00', status: 'present', marked_at: twoDaysAgo + 'T16:05:00Z', marked_by: adminId },
        { course_id: course1, student_id: s2, session_date: twoDaysAgo, session_start_time: '16:00', status: 'absent_preavvisato', absence_reason: 'Influenza' },
        { course_id: course1, student_id: s4, session_date: twoDaysAgo, session_start_time: '16:00', status: 'present', marked_at: twoDaysAgo + 'T16:02:00Z', marked_by: adminId },
        { course_id: course2, student_id: s3, session_date: yesterday, session_start_time: '17:30', status: 'present', marked_at: yesterday + 'T17:35:00Z', marked_by: adminId },
        { course_id: course2, student_id: s1, session_date: yesterday, session_start_time: '17:30', status: 'absent', marked_at: yesterday + 'T18:00:00Z', marked_by: adminId },
        { course_id: course3, student_id: s2, session_date: today, session_start_time: '15:00', status: 'absent_preavvisato', absence_reason: 'Gita scolastica' },
        { course_id: course3, student_id: s3, session_date: today, session_start_time: '15:00', status: 'unknown' },
        { course_id: course3, student_id: s5, session_date: today, session_start_time: '15:00', status: 'unknown' },
      ]);
      console.log('  ✓ Presenze create');

      await supabase.from('payments').insert([
        { student_id: s1, amount: 80, description: 'Retta Marzo 2024 - Pianoforte + Chitarra', due_date: '2024-03-10', status: 'paid', paid_at: '2024-03-05T14:30:00Z', payment_reference: 'SUMUP-TXN-001' },
        { student_id: s2, amount: 60, description: 'Retta Marzo 2024 - Pianoforte', due_date: '2024-03-10', status: 'paid', paid_at: '2024-03-02T09:15:00Z', payment_reference: 'SUMUP-TXN-002' },
        { student_id: s3, amount: 70, description: 'Retta Marzo 2024 - Chitarra + Canto', due_date: '2024-03-10', status: 'pending' },
        { student_id: s4, amount: 60, description: 'Retta Febbraio 2024 - Pianoforte', due_date: '2024-02-28', status: 'expired' },
      ]);
      console.log('  ✓ Pagamenti creati');

      const futureDate1 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const futureDate2 = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];
      const futureDate3 = new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0];

      await supabase.from('events').insert([
        { title: 'Saggio di Primavera', description: 'Esibizione degli allievi dei corsi di pianoforte e chitarra. Ingresso libero per familiari.', event_date: futureDate1, event_time: '17:00', location: 'Sala Concerti - Via Roma 15', is_public: true, created_by: adminId },
        { title: 'Chiusura per Festività', description: 'La scuola resterà chiusa per le festività pasquali. Le lezioni riprenderanno regolarmente il 2 aprile.', event_date: futureDate2, is_public: true, created_by: adminId },
        { title: 'Concerto di Fine Anno', description: 'Grande concerto di fine anno con tutti i corsi. Prenotazione posti obbligatoria.', event_date: futureDate3, event_time: '18:30', location: 'Teatro Comunale', is_public: true, created_by: adminId },
      ]);
      console.log('  ✓ Eventi creati');
    }
  }

  console.log('\n✅ Seed completato!');
  console.log('\nCredenziali per il login:');
  console.log('  Admin: admin@vivapush.it / admin123');
  console.log('  Genitore: genitore.bianchi@gmail.com / user123');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

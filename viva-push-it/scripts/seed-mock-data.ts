/**
 * Script per popolare il database con mock data
 * Eseguire con: npx tsx scripts/seed-mock-data.ts
 * Oppure adattare per Supabase: inserire i dati via API o SQL
 *
 * Per ora i dati sono caricati staticamente in src/data/mockData.ts
 * e usati dall'app. Questo script può essere usato per seed su DB reale.
 */

// Import dinamico per evitare side-effect in build
async function main() {
  const { mockStudents, mockCourses, mockEnrollments, mockAttendances, mockPayments, mockEvents } =
    await import('../src/data/mockData');

  console.log('Mock data summary:');
  console.log('- Students:', mockStudents.length);
  console.log('- Courses:', mockCourses.length);
  console.log('- Enrollments:', mockEnrollments.length);
  console.log('- Attendances:', mockAttendances.length);
  console.log('- Payments:', mockPayments.length);
  console.log('- Events:', mockEvents.length);

  // Output JSON per eventuale import
  const output = {
    students: mockStudents,
    courses: mockCourses,
    enrollments: mockEnrollments,
    attendances: mockAttendances,
    payments: mockPayments,
    events: mockEvents,
  };

  console.log('\nJSON output (primi 200 caratteri):');
  console.log(JSON.stringify(output).slice(0, 200) + '...');
}

main().catch(console.error);

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { UserLayout } from './layouts/UserLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AllieviPage } from './pages/admin/AllieviPage';
import { CorsiPage } from './pages/admin/CorsiPage';
import { PresenzePage } from './pages/admin/PresenzePage';
import { ContabilePage } from './pages/admin/ContabilePage';
import { CalendarioPage } from './pages/admin/CalendarioPage';
import { BachecaPage } from './pages/admin/BachecaPage';
import { UtentiPage } from './pages/admin/UtentiPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { UserProfilePage } from './pages/user/UserProfilePage';
import { ProssimeLezioniPage } from './pages/user/ProssimeLezioniPage';
import { PagamentiPage } from './pages/user/PagamentiPage';
import { EventiPage } from './pages/user/EventiPage';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
      <BrowserRouter>
        <Routes>
          {/* Area pubblica */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Area Admin (protetta) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="allievi" element={<AllieviPage />} />
            <Route path="corsi" element={<CorsiPage />} />
            <Route path="presenze" element={<PresenzePage />} />
            <Route path="contabile" element={<ContabilePage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="bacheca" element={<BachecaPage />} />
            <Route path="utenti" element={<UtentiPage />} />
            <Route path="profilo" element={<AdminProfilePage />} />
          </Route>

          {/* Area Utente/Genitori (protetta) */}
          <Route
            path="/area-utente"
            element={
              <ProtectedRoute allowedRoles={['user', 'maestro']}>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserProfilePage />} />
            <Route path="prossime-lezioni" element={<ProssimeLezioniPage />} />
            <Route path="pagamenti" element={<PagamentiPage />} />
            <Route path="eventi" element={<EventiPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;

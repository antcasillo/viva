import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import Cookies from 'js-cookie';
import type { User, UserRole } from '../types/database';
import { apiClient, isBackendConfigured } from '../lib/apiClient';
import { loginBackend, fetchProfileBackend } from '../services/apiBackend';
import { getUserByEmail, checkPassword } from '../store/usersStore';

const COOKIE_NAME = 'viva_session';
const COOKIE_DAYS = 30;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser(): User | null {
  const cookie = Cookies.get(COOKIE_NAME);
  if (cookie) {
    try {
      const data = JSON.parse(decodeURIComponent(cookie));
      if (data?.expires && new Date(data.expires) < new Date()) {
        Cookies.remove(COOKIE_NAME);
        return null;
      }
      return data.user ?? null;
    } catch {
      Cookies.remove(COOKIE_NAME);
    }
  }
  const session = sessionStorage.getItem('viva_session');
  if (session) {
    try {
      return JSON.parse(session);
    } catch {
      sessionStorage.removeItem('viva_session');
    }
  }
  return null;
}

function setStoredUser(user: User, rememberMe: boolean) {
  if (rememberMe) {
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_DAYS);
    Cookies.set(COOKIE_NAME, encodeURIComponent(JSON.stringify({ user, expires: expires.toISOString() })), {
      expires: COOKIE_DAYS,
      sameSite: 'Lax',
      secure: window.location.protocol === 'https:',
    });
  } else {
    sessionStorage.setItem('viva_session', JSON.stringify(user));
  }
}

function clearStoredUser() {
  Cookies.remove(COOKIE_NAME);
  sessionStorage.removeItem('viva_session');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isBackendConfigured()) {
      fetchProfileBackend().then((profile) => {
        if (profile) setUser(profile);
        setIsLoading(false);
      });
    } else {
      const stored = getStoredUser();
      setUser(stored);
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    try {
      if (isBackendConfigured()) {
        const result = await loginBackend(email, password, rememberMe);
        if (result.success && result.user) {
          setUser(result.user);
          setStoredUser(result.user, rememberMe);
          return { success: true, user: result.user };
        }
        return { success: false, error: result.error ?? 'Email o password non corretti' };
      }

      await new Promise((r) => setTimeout(r, 400));
      const foundUser = getUserByEmail(email);
      if (!foundUser || !checkPassword(email, password)) {
        return { success: false, error: 'Email o password non corretti' };
      }
      setUser(foundUser);
      setStoredUser(foundUser, rememberMe);
      return { success: true, user: foundUser };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (isBackendConfigured()) apiClient.clearToken();
    setUser(null);
    clearStoredUser();
  }, []);

  const refreshUser = useCallback(async () => {
    if (isBackendConfigured()) {
      const profile = await fetchProfileBackend();
      if (profile) setUser(profile);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function useRequireRole(allowedRoles: UserRole[]) {
  const { user, isAuthenticated } = useAuth();
  const hasAccess = isAuthenticated && user && allowedRoles.includes(user.role);
  return { user, isAuthenticated, hasAccess };
}

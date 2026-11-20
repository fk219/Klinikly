import { useState, type ReactNode } from 'react';
import { isApiError } from '@app/shared';
import { apiLogin, apiLogout, type AdminUser } from '../api/auth';
import { clearAccessToken, setAccessToken, getAccessToken } from '../api/client';
import { AuthContext } from './auth-context';

const USER_KEY = 'adminUser';

const readStoredUser = (): AdminUser | null => {
  if (!getAccessToken()) return null;

  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AdminUser;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(readStoredUser);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await apiLogin({ email, password });
    setLoading(false);

    if (isApiError(res)) {
      return { ok: false, error: res.error.message };
    }

    if (res.data.user.role !== 'hospital_admin') {
      return { ok: false, error: 'Access denied. Hospital admin account required.' };
    }

    setAccessToken(res.data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
    setUser(res.data.user);
    return { ok: true };
  };

  const logout = async () => {
    await apiLogout();
    clearAccessToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

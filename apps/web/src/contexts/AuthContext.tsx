import { useState, useEffect, type ReactNode } from 'react';
import { User } from '../types';
import { isApiError } from '@app/shared';
import { apiLogin, apiLogout, apiRegister } from '../api/auth';
import { AuthContext } from './authStore';

const userKey = 'currentUser';
const tokenKey = 'accessToken';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(userKey);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);

    if (!password) {
      setLoading(false);
      return false;
    }

    const res = await apiLogin({ email, password });
    if (isApiError(res)) {
      setLoading(false);
      return false;
    }

    localStorage.setItem(tokenKey, res.data.accessToken);
    localStorage.setItem(userKey, JSON.stringify(res.data.user));
    setUser(res.data.user);
    setLoading(false);
    return true;
  };

  const register = async (userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<boolean> => {
    setLoading(true);

    const res = await apiRegister(userData);
    if (isApiError(res)) {
      setLoading(false);
      return false;
    }

    localStorage.setItem(tokenKey, res.data.accessToken);
    localStorage.setItem(userKey, JSON.stringify(res.data.user));
    setUser(res.data.user);
    setLoading(false);
    return true;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    localStorage.removeItem(userKey);
    localStorage.removeItem(tokenKey);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

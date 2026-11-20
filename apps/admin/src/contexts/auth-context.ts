import { createContext } from 'react';
import type { AdminUser } from '../api/auth';

export type AuthContextType = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

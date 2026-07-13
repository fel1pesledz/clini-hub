/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  role: 'admin' | 'doctor';
  name: string;
  doctorId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  loginAsAdmin: (password: string) => Promise<void>;
  loginAsDoctor: (doctorId: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('clinihub_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  // Ao montar, valida o token salvo chamando /api/auth/me
  useEffect(() => {
    const validate = async () => {
      const saved = localStorage.getItem('clinihub_token');
      if (!saved) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${saved}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setToken(saved);
        } else {
          // Token expirado ou inválido
          localStorage.removeItem('clinihub_token');
          setToken(null);
        }
      } catch {
        localStorage.removeItem('clinihub_token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    validate();
  }, []);

  const handleLoginResponse = (data: any) => {
    localStorage.setItem('clinihub_token', data.token);
    setToken(data.token);
    setUser({
      role: data.role,
      name: data.name,
      doctorId: data.doctorId,
    });
  };

  const loginAsAdmin = async (password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao fazer login');
    handleLoginResponse(data);
  };

  const loginAsDoctor = async (doctorId: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'doctor', doctorId, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Senha incorreta');
    handleLoginResponse(data);
  };

  const logout = () => {
    localStorage.removeItem('clinihub_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, loginAsAdmin, loginAsDoctor, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

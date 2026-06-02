'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as auth from '@/lib/auth';
import type { User, LoginDto } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = auth.getStoredUser();
    if (storedUser && auth.isAuthenticated()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const response = await auth.login(dto);
    setUser(response.user);
    auth.setStoredUser(response.user);
    router.push('/users');
  }, [router]);

  const logout = useCallback(async () => {
    await auth.logout();
    auth.clearStoredUser();
    setUser(null);
    router.push('/');
  }, [router]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await auth.changePassword({ currentPassword, newPassword });
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    changePassword,
  };
}

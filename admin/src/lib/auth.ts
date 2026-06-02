import { api } from './api';
import type { AuthResponse, LoginDto, ChangePasswordDto, User } from '@/types';

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/admin/login', dto);
  api.setTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    api.clearTokens();
  }
}

export async function changePassword(dto: ChangePasswordDto): Promise<void> {
  await api.patch('/auth/admin/change-password', dto);
}

export function isAuthenticated(): boolean {
  return !!api.getAccessToken();
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem('user');
}

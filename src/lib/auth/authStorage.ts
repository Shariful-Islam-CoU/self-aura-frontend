// Centralized authentication storage utilities
// Never store passwords, never log tokens, never put tokens in URLs
// The backend issues a single JWT (no refresh token), so only that and the
// cached user are persisted. Everything is kept in localStorage under a
// namespaced key so it is easy to clear and cannot collide with other apps.

const AUTH_TOKEN_KEY = "self_aura_auth_token";
const USER_KEY = "self_aura_user";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): import("@/features/auth/types").User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setStoredUser(user: import("@/features/auth/types").User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

export function clearAllAuth(): void {
  clearAuthToken();
  clearStoredUser();
}

export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}
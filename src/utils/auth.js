import axios from "axios";

const STORAGE_KEY = "ezstore_user";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Safely parse any JSON string from localStorage.
function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function extractUserFromLoginResponse(payload) {
  if (!payload || typeof payload !== "object") return null;

  // Support common backend response shapes.
  const candidate =
    payload.user ||
    payload.data?.user ||
    (payload.role ? { role: payload.role } : null);

  if (!candidate || !candidate.role) return null;
  return candidate;
}

export function setStoredUser(user) {
  if (!user) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function getStoredRole() {
  const user = getStoredUser();
  return user?.role || null;
}

export function clearStoredUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function fetchCurrentUser() {
  const res = await axios.get(`${API_BASE}/api/auth/me`, {
    withCredentials: true,
  });
  const user = res?.data?.user || null;
  if (user?.role) setStoredUser(user);
  return user;
}

export async function restoreUserSession() {
  try {
    return await fetchCurrentUser();
  } catch (err) {
    const status = err?.response?.status;
    if (status !== 401) {
      return getStoredUser();
    }
  }

  try {
    await axios.post(
      `${API_BASE}/api/auth/refresh-token`,
      {},
      { withCredentials: true }
    );
    return await fetchCurrentUser();
  } catch {
    clearStoredUser();
    return null;
  }
}

const STORAGE_KEY = "ezstore_user";

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


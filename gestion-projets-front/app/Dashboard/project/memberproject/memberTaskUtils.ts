/** Helpers partagés pour les pages tâches membres */

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token') || localStorage.getItem('token');
}

export function getCurrentUserId(): number | null {
  try {
    if (typeof window === 'undefined') return null;

    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id != null) return Number(u.id);
    }

    const token = getToken();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    const decoded = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (decoded?.id != null) return Number(decoded.id);
    if (decoded?.sub != null && !String(decoded.sub).includes('@')) {
      const sub = Number(decoded.sub);
      return Number.isFinite(sub) ? sub : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** L'API peut renvoyer assignedTo comme id, objet { id }, ou string */
export function getAssignedUserId(assignedTo: unknown): number | null {
  if (assignedTo == null) return null;
  if (typeof assignedTo === 'object') {
    const id = (assignedTo as { id?: unknown }).id;
    return id != null ? Number(id) : null;
  }
  const n = Number(assignedTo);
  return Number.isFinite(n) ? n : null;
}

export function isTaskOwnedByUser(assignedTo: unknown, userId: number | null): boolean {
  if (userId == null) return false;
  return getAssignedUserId(assignedTo) === userId;
}

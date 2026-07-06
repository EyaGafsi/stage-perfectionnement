'use client';

import { useMemo } from 'react';

// ─── Mirrors backend UserRole enum exactly ────────────────────────────────────
export enum UserRole {
  SUPER_ADMIN         = 'super_admin',
  ADMIN_COMPANY       = 'admin_company',
  MANAGER             = 'manager',
  PROJECT_MANAGER     = 'project_manager',
  CALL_CENTER_MANAGER = 'call_center_manager',
  SALES_MANAGER       = 'sales_manager',
  MARKETING_MANAGER   = 'marketing_manager',
  QUALITY_MANAGER     = 'quality_manager',
  HR_MANAGER          = 'hr_manager',
  AGENT_TELEPRO       = 'agent_telepro',
  COMMERCIAL          = 'commercial',
  MARKETING_AGENT     = 'marketing_agent',
  QUALITE_AGENT       = 'qualite_agent',
  TECH_SUPPORT        = 'tech_support',
  MEMBER              = 'member',
}

// ─── Permission matrix ────────────────────────────────────────────────────────
//
//  Role             | Infos projet | Membres | Détails domaine | Raw preview
//  -----------------|:------------:|:-------:|:---------------:|:-----------:
//  admin_company    |   ✏️ edit    |  ✏️     |   ✏️            |   ✅
//  super_admin      |   ✏️ edit    |  ✏️     |   ✏️            |   ✅
//  manager          |   ✏️ edit    |  ✏️     |   👁 read-only   |   ❌
//  project_manager  |   👁 read    |  ✏️     |   ✏️            |   ✅
//  others           |   👁 read    |  👁     |   👁 read-only   |   ❌

function readUserFromLocalStorage(): any {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function decodeJwtRole(token?: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const obj = JSON.parse(
      decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))))
    );
    return obj.role || obj.roles?.[0] || obj.userRole || obj.realm_access?.roles?.[0] || null;
  } catch { return null; }
}

function getRawRole(): string | null {
  const u = readUserFromLocalStorage();
  if (u?.role) return String(u.role).toLowerCase();
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const r = decodeJwtRole(token);
  return r ? String(r).toLowerCase() : null;
}

export function useAuth() {
  const role = useMemo((): UserRole | null => {
    const raw = getRawRole();
    if (!raw) return null;
    return (Object.values(UserRole) as string[]).includes(raw)
      ? (raw as UserRole)
      : null;
  }, []);

  const isAdmin          = role === UserRole.ADMIN_COMPANY || role === UserRole.SUPER_ADMIN;
  const isManager        = role === UserRole.MANAGER;
  const isProjectManager = role === UserRole.PROJECT_MANAGER;

  return {
    role,
    isAdmin,
    isManager,
    isProjectManager,
    /** Infos projet : edit = admin + manager | read = PM + others */
    canEditProjectInfo:   isAdmin || isManager,
    /** Membres : add = PM | read = others */
    canEditMembers:       isProjectManager,
    /** Détails domaine : edit = admin + PM | hidden = others */
    canEditDomainDetails: isAdmin || isProjectManager,
    canSeeDomainDetails:  isAdmin || isManager || isProjectManager,
    /** Sprints : edit = admin + PM | read-only = manager */
    canEditSprints:       isAdmin || isProjectManager,
    /** Raw JSON preview */
    canSeeRawPreview:     isAdmin || isProjectManager,
  };
}
/**
 * permissions.ts — Role-based access control helpers.
 */

import { UserProfile } from '../types/user.ts';

// Re-export so callers can import from one place
export { SUPER_ADMIN_UID } from './superAdminBootstrap.ts';

const SUPER_ADMIN_UID_LOCAL = 'gfhWRztes9dYzGzHBu9MjZH5Uuo2';

/** Check if the user is the permanent Super Admin */
export const isSuperAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.uid === SUPER_ADMIN_UID_LOCAL || user.role === 'SUPER_ADMIN';
};

/** Check if the user is an admin or super admin */
export const isDistrictAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || !!user.isAdmin;
};

/** Check if the user is a verified government officer */
export const isOfficer = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'OFFICIAL';
};

/** Check if the user is a regular citizen */
export const isCitizen = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'CITIZEN';
};

/**
 * Check if the user has a specific permission.
 * Super Admin always passes with wildcard '*'.
 */
export const hasPermission = (
  user: UserProfile | null | undefined,
  permission: string
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  const perms = user.permissions || [];
  return perms.includes('*') || perms.includes(permission);
};

/** Check if user can access any admin route */
export const canAccessAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return isSuperAdmin(user) || isDistrictAdmin(user) || !!user.isAdmin;
};

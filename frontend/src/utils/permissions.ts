import { UserProfile } from '../types/user.ts';

/**
 * Permanent Super Admin UID — never changes, never hardcoded elsewhere.
 */
export const SUPER_ADMIN_UID = 'gfhWRztes9dYzGzHBu9MjZH5Uuo2';

/**
 * Check if the user is the permanent Super Admin
 */
export const isSuperAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.uid === SUPER_ADMIN_UID || user.role === 'SUPER_ADMIN';
};

/**
 * Check if the user is an admin or super admin
 */
export const isDistrictAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || !!user.isAdmin;
};

/**
 * Check if the user is a verified government officer
 */
export const isOfficer = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'OFFICIAL';
};

/**
 * Check if the user is a regular citizen
 */
export const isCitizen = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'CITIZEN';
};

/**
 * Check if the user has a specific permission
 * Super Admin has wildcard permission '*'
 */
export const hasPermission = (
  user: UserProfile | null | undefined,
  permission: string
): boolean => {
  if (!user) return false;

  // Super Admin has all permissions
  if (isSuperAdmin(user)) return true;

  const perms = user.permissions || [];

  // Wildcard grants all permissions
  if (perms.includes('*')) return true;

  return perms.includes(permission);
};

/**
 * Check if user can access admin routes at all
 */
export const canAccessAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return isSuperAdmin(user) || isDistrictAdmin(user) || !!user.isAdmin;
};

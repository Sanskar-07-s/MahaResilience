/**
 * permissions.ts — Comprehensive Role & Module Access Control Helpers for MahaResilience
 */

import { UserProfile, AdminField } from '../types/user.ts';

export { SUPER_ADMIN_UID } from './superAdminBootstrap.ts';

export const SUPER_ADMIN_UID_LOCAL = 'gfhWRztes9dYzGzHBu9MjZH5Uuo2';

/** Check if the user is the permanent Super Admin */
export const isSuperAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return (
    user.uid === SUPER_ADMIN_UID_LOCAL ||
    user.id === SUPER_ADMIN_UID_LOCAL ||
    user.role === 'SUPER_ADMIN'
  );
};

/** Check if the user is a District Admin */
export const isDistrictAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return isSuperAdmin(user) || user.role === 'DISTRICT_ADMIN';
};

/** Check if the user is an officer */
export const isOfficer = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'OFFICIAL' || isSuperAdmin(user);
};

/** Check if the user is a regular citizen */
export const isCitizen = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'CITIZEN' || user.role === 'USER';
};

/** Check if the user has any administrative or moderation role */
export const canAccessAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (user.isAdmin === true) return true;

  const role = user.role || '';
  return (
    role === 'MODULE_ADMIN' ||
    role === 'DISTRICT_ADMIN' ||
    role === 'MODERATOR' ||
    role.includes('ADMIN') ||
    role.includes('MODERATOR') ||
    role === 'OFFICIAL'
  );
};

/** Check if user can access a specific adminField module */
export const canAccessAdminField = (
  user: UserProfile | null | undefined,
  field: AdminField | string
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (user.status === 'SUSPENDED') return false;

  if (user.role === 'MODULE_ADMIN' && user.adminField === field) return true;
  if (user.role === `${field}_ADMIN`) return true;

  const perms = user.permissions || [];
  return perms.includes('*') || perms.includes(`MANAGE_${field}`) || perms.includes(field);
};

/** Check specific permission */
export const hasPermission = (
  user: UserProfile | null | undefined,
  permission: string
): boolean => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (user.status === 'SUSPENDED') return false;
  const perms = user.permissions || [];
  return perms.includes('*') || perms.includes(permission);
};
